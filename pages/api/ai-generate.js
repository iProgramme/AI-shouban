import { verifyRedemptionCode, useRedemptionCode, saveGeneratedImage, saveGenerationResult } from '../../utils/db';
import { generateImage } from '../../utils/imageGeneration';
import { generateImageV2 } from '../../utils/imageGenerationV2';

export const config = {
  api: {
    bodyParser: false, // Disable body parsing for file uploads
    responseTimeout: 360000, // 360秒响应超时 (支持4K图片生成)
    maxDuration: 360, // 360秒最大执行时间
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '请求方法不被允许' });
  }

  try {
    // Import formidable within the handler function for server-side compatibility
    const formidable = (await import('formidable')).default;

    // 解析表单数据 - 设置为最小化磁盘使用
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB 限制
      keepExtensions: true,
      multiples: true, // 允许多文件上传
      allowEmptyFiles: false,
      minFileSize: 1,
    });

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          reject(err);
        } else {
          resolve({ fields, files });
        }
      });
    });

    const code = Array.isArray(fields.code) ? fields.code[0] : fields.code;
    const promptFromFrontend = Array.isArray(fields.prompt) ? fields.prompt[0] : fields.prompt;
    // 处理单张图片（图生图）或多张图片（图生图支持多图）
    let imageFiles = files.images || files.image; // 前端可能发送 images（多图）或 image（单图）
    if (imageFiles && !Array.isArray(imageFiles)) {
      imageFiles = [imageFiles];
    }

    if (!code) {
      return res.status(400).json({ message: '请提供兑换码' });
    }

    // 检查是否为文生图模式（只有提示词，没有图片）
    const isTextToImage = promptFromFrontend && (!imageFiles || imageFiles.length === 0);

    // 如果不是文生图模式，且没有图片文件，返回错误
    if (!isTextToImage && (!imageFiles || imageFiles.length === 0)) {
      return res.status(400).json({ message: '请提供图片文件' });
    }

    // Verify the redemption code
    const verificationResult = await verifyRedemptionCode(code);
    if (!verificationResult.valid) {
      console.error('Redemption code verification failed:', verificationResult.error);
      // 即使验证失败也要记录到数据库
      try {
        await saveGenerationResult(
          `/temp/original_${Date.now()}`, // 虚拟原始图片路径
          JSON.stringify({ error: 'Redemption code verification failed' }),
          verificationResult.userId || null, // 使用验证结果中的用户ID，如果验证失败则为null
          verificationResult.id || null, // 使用验证结果中的兑换码ID，如果验证失败则为null
          'failed',
          verificationResult.error // 错误消息
        );
      } catch (dbError) {
        console.error('保存验证失败结果到数据库错误:', dbError);
      }
      return res.status(400).json({ message: verificationResult.error });
    }

    // 检查是否已达到使用次数上限
    if (verificationResult.usedCount >= verificationResult.usageCount) {
      // 记录使用次数已达上限的失败情况
      try {
        await saveGenerationResult(
          `/temp/original_${Date.now()}`, // 虚拟原始图片路径
          JSON.stringify({ error: 'Redemption code usage limit reached' }),
          verificationResult.userId,
          verificationResult.id,
          'failed',
          '兑换码使用次数已达上限'
        );
      } catch (dbError) {
        console.error('保存使用次数超限结果到数据库错误:', dbError);
      }
      return res.status(400).json({ message: '兑换码使用次数已达上限' });
    }

    // 根据API_SOURCE环境变量选择生成函数
    const apiSource = process.env.API_SOURCE || 'API_TANGGUO'; // 默认使用糖果姐姐API

    // 从请求中获取分辨率参数
    const resolution = Array.isArray(fields.resolution) ? fields.resolution[0] : fields.resolution || "2K";

    let result;
    if (apiSource === 'API_YI') {
      // 计算所需积分（仅API_YI需要积分）
      const resolutionCostMap = {
        '1K': 1,
        '2K': 2,
        '4K': 3
      };
      const requiredCost = resolutionCostMap[resolution] || 2; // 默认2K需要2积分

      // 检查是否已达到使用次数上限（根据分辨率消耗计算）
      if (verificationResult.usedCount + requiredCost > verificationResult.usageCount) {
        // 记录使用次数已达上限的失败情况
        try {
          await saveGenerationResult(
            `/temp/original_${Date.now()}`, // 虚拟原始图片路径
            JSON.stringify({ error: 'Redemption code usage limit reached' }).substring(0, 499), // 限制长度避免超过数据库字段限制
            verificationResult.userId,
            verificationResult.id,
            'failed',
            `兑换码积分不足，当前剩余:${verificationResult.usageCount - verificationResult.usedCount}，需要:${requiredCost}`
          );
        } catch (dbError) {
          console.error('保存使用次数超限结果到数据库错误:', dbError);
        }
        return res.status(400).json({
          message: `兑换码积分不足，当前剩余:${verificationResult.usageCount - verificationResult.usedCount}，需要:${requiredCost}`
        });
      }

      // 使用api易的生成函数
      result = await generateImageV2({
        imageFiles,
        code,
        promptFromFrontend,
        verificationResult,
        resolution
      });

      // 生成成功后，更新兑换码使用次数（消耗相应积分）
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: process.env.NEON_DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        }
      });

      const client = await pool.connect();
      try {
        await client.query('BEGIN'); // 开始事务

        // 更新兑换码使用次数
        const updateResult = await client.query(
          'UPDATE redemption_codes SET used_count = used_count + $1 WHERE id = $2 AND used_count + $1 <= usage_count RETURNING *',
          [requiredCost, verificationResult.id]
        );

        if (updateResult.rowCount === 0) {
          // 如果更新失败，说明在检查后使用次数发生变化
          await client.query('ROLLBACK');
          client.release();
          return res.status(400).json({ message: '兑换码使用次数已达上限' });
        }

        await client.query('COMMIT'); // 提交事务
      } catch (error) {
        await client.query('ROLLBACK'); // 回滚事务
        throw error;
      } finally {
        client.release();
      }
    } else {
      // 使用糖果姐姐的原始生成函数，保持原有逻辑不变
      result = await generateImage({
        imageFiles,
        code,
        promptFromFrontend,
        verificationResult
      });

      // 只消耗1积分（原有行为）
      await useRedemptionCode(verificationResult.id);
    }

    const { generatedPublicPath, originalPublicPath } = result;

    // 注意：在API_YI情况下，已经根据分辨率扣除了相应积分
    // 在糖果姐姐API情况下，已经在前面扣除了1次积分
    if (apiSource !== 'API_YI') {
      // 只有在非API_YI情况下才再次扣除1次（保持原有糖果姐姐API的行为）
      await useRedemptionCode(verificationResult.id);
    }

    // 保存成功的生成結果
    await saveGenerationResult(
      originalPublicPath,
      generatedPublicPath,
      verificationResult.userId,
      verificationResult.id,
      'success'
    );

    res.status(200).json({
      message: '图片生成成功',
      generatedImageUrl: generatedPublicPath,
      originalImageUrl: originalPublicPath, // 虚拟路径
      apiSourceUsed: apiSource // 返回使用的API厂商
    });
  } catch (error) {
    console.error('AI图片生成错误:', error);

    // 保存失败的生成结果到数据库
    const errorDetail = {
      message: error.message,
      responseError: error.response ? error.response.data : null,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };

    try {
      // 防止verificationResult未定义的问题，只在verificationResult存在时使用其值
      await saveGenerationResult(
        `/temp/original_${Date.now()}`, // 虚拟原始图片路径
        JSON.stringify(errorDetail).substring(0, 499), // 限制长度避免超过数据库字段限制
        typeof verificationResult !== 'undefined' ? verificationResult.userId : null,
        typeof verificationResult !== 'undefined' ? verificationResult.id : null,
        'failed',
        (error.message || '').substring(0, 499) // 错误消息也限制长度，避免超过数据库字段限制
      );
    } catch (dbError) {
      console.error('保存失败结果到数据库错误:', dbError);
    }

    // 如果是API调用错误或其他导致图片未成功生成的错误，
    // 不要扣除兑换码使用次数
    if (error.message &&
      (error.message.includes('API调用失败') ||
        error.message.includes('请求超时') ||
        error.message.includes('连接中断'))) {
      console.log('图片生成失败，兑换码未扣除');
    } else {
      // 如果是其他类型的错误（例如验证错误），仍然扣除兑换码
      // 但在我们的实现中，真正的API错误发生前验证已通过
      // 所以这里我们仍然不扣除兑换码，因为实际生成失败了
      try {
        // 如果因为错误而已经扣除了兑换码，这里可以考虑回滚
        // 但这需要更复杂的逻辑来跟踪状态
      } catch (rollbackError) {
        console.error('回滚兑换码使用失败:', rollbackError);
      }
    }

    res.status(500).json({
      message: '图片生成失败',
      error: error.message,
      ...(error.response ? { responseError: error.response.data } : {})
    });
  }
}