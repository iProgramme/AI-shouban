// utils/imageGenerationStrategy.js
import { generateImage } from './imageGeneration.js';
import { generateImageV2 } from './imageGenerationV2.js';

/**
 * 图片生成策略管理器
 * 根据环境变量选择不同的图片生成实现
 */
export class ImageGenerationStrategy {
  /**
   * 根据环境变量生成图片
   * @param {Object} params - 生成参数
   * @returns {Promise<Object>} 生成结果
   */
  static async generateImage(params) {
    const apiSource = process.env.API_SOURCE || 'API_TANGGUO'; // 默认使用糖果姐姐API

    if (apiSource === 'API_YI') {
      return await generateImageV2(params);
    } else {
      return await generateImage(params);
    }
  }

  /**
   * 获取当前使用的API厂商名称
   * @returns {string} API厂商名称
   */
  static getCurrentStrategy() {
    const apiSource = process.env.API_SOURCE || 'API_TANGGUO'; // 默认使用糖果姐姐API

    return apiSource;
  }

  /**
   * 获取可用的生成策略列表
   * @returns {Array<string>} 策略名称列表
   */
  static getAvailableStrategies() {
    return ['original', 'gemini', 'v2'];
  }
}

/**
 * 便捷函数：使用环境变量配置的策略生成图片
 * @param {Object} params - 生成参数
 * @returns {Promise<Object>} 生成结果
 */
export async function generateImageWithStrategy(params) {
  return await ImageGenerationStrategy.generateImage(params);
}

/**
 * 便捷函数：获取当前使用的策略
 * @returns {string} 策略名称
 */
export function getCurrentStrategy() {
  return ImageGenerationStrategy.getCurrentStrategy();
}