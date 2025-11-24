#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gemini 3 Pro Image - 文本生成图片示例

功能：根据文字描述生成图片，支持 1K/2K/4K 三种分辨率
模型：gemini-3-pro-image-preview (Nano Banana Pro)
价格：约 $0.05/张
"""

import requests
import base64
import time
from datetime import datetime

# ============================================================================
# 配置区域 - 请在此处修改您的配置
# ============================================================================

# 1. API Key（必填）- 从 https://api.apiyi.com 获取
API_KEY = "sk-填在这里"

# 2. API 端点（无需修改）
API_URL = "https://api.apiyi.com/v1beta/models/gemini-3-pro-image-preview:generateContent"

# 3. 生成配置（可根据需求修改）
CONFIG = {
    "prompt": "一只可爱的小猫咪坐在花园里，油画风格，高清，细节丰富",  # 图片描述
    "aspect_ratio": "16:9",      # 宽高比：1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3, 21:9, 5:4, 4:5
    "resolution": "2K",          # 分辨率：1K, 2K, 4K （推荐 2K）
    "output_file": f"NanoBananaPro_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"  # 输出文件名（自动添加时间戳）
}

# 4. 超时时间（秒）- 根据分辨率自动选择
TIMEOUT = {
    "1K": 180,  # 3 分钟 - 快速预览
    "2K": 300,  # 5 分钟 - 推荐使用
    "4K": 360,  # 6 分钟 - 超高清
}

# ============================================================================
# 分辨率参考表
# ============================================================================
"""
宽高比 | 1K 分辨率   | 2K 分辨率   | 4K 分辨率
-------|------------|------------|------------
1:1    | 1024×1024  | 2048×2048  | 4096×4096
16:9   | 1376×768   | 2752×1536  | 5504×3072
9:16   | 768×1376   | 1536×2752  | 3072×5504
4:3    | 1200×896   | 2400×1792  | 4800×3584
3:4    | 896×1200   | 1792×2400  | 3584×4800
21:9   | 1584×672   | 3168×1344  | 6336×2688
"""

# ============================================================================
# 核心生成函数
# ============================================================================

def generate_image(prompt, aspect_ratio="1:1", resolution="2K"):
    """
    生成图片的核心函数
    
    参数说明：
        prompt: 图片描述文字，例如 "一只可爱的猫"
        aspect_ratio: 图片宽高比，例如 "1:1" (方形), "16:9" (横屏)
        resolution: 图片分辨率，"1K" (快速), "2K" (推荐), "4K" (超清)
    
    返回：
        成功：返回 {"success": True, "image_data": "base64数据"}
        失败：返回 {"success": False, "error": "错误信息"}
    """
    
    print(f"\n{'='*60}")
    print(f"🎨 开始生成图片")
    print(f"{'='*60}")
    print(f"📝 提示词: {prompt}")
    print(f"📐 宽高比: {aspect_ratio}")
    print(f"🔍 分辨率: {resolution}")
    print(f"⏱️  预计时间: {TIMEOUT[resolution] // 60} 分钟")
    
    # ========================================
    # 步骤 1: 构建请求参数
    # ========================================
    payload = {
        # 内容部分：包含文本提示词
        "contents": [
            {
                "parts": [
                    {"text": prompt}  # 您的图片描述
                ]
            }
        ],
        
        # 生成配置部分
        "generationConfig": {
            "responseModalities": ["IMAGE"],  # 指定返回图片
            
            # 图片配置（关键部分）
            "imageConfig": {
                "aspectRatio": aspect_ratio,  # 宽高比
                "image_size": resolution       # 分辨率 (1K/2K/4K)
            }
        }
    }
    
    # ========================================
    # 步骤 2: 设置请求头
    # ========================================
    headers = {
        "Authorization": f"Bearer {API_KEY}",  # API 认证
        "Content-Type": "application/json"      # 数据格式
    }
    
    # ========================================
    # 步骤 3: 发送 API 请求
    # ========================================
    print(f"\n🚀 正在请求 API...")
    start_time = time.time()
    
    try:
        response = requests.post(
            API_URL,
            headers=headers,
            json=payload,
            timeout=TIMEOUT[resolution]
        )
        
        elapsed = time.time() - start_time
        print(f"✅ 请求完成，耗时 {elapsed:.1f} 秒")
        
        # ========================================
        # 步骤 4: 解析响应数据
        # ========================================
        if response.status_code == 200:
            data = response.json()
            
            # 从响应中提取图片数据
            # 响应结构: data -> candidates -> content -> parts -> inlineData -> data
            # 注意：响应中使用驼峰命名 inlineData，不是 inline_data
            try:
                parts = data["candidates"][0]["content"]["parts"]
                
                # 遍历 parts 查找图片数据（可能在不同位置）
                for part in parts:
                    # 尝试驼峰命名
                    if "inlineData" in part:
                        image_base64 = part["inlineData"]["data"]
                        return {
                            "success": True,
                            "image_data": image_base64,
                            "elapsed_time": elapsed
                        }
                    # 兼容下划线命名
                    elif "inline_data" in part:
                        image_base64 = part["inline_data"]["data"]
                        return {
                            "success": True,
                            "image_data": image_base64,
                            "elapsed_time": elapsed
                        }
                
                # 如果没找到图片数据，返回完整响应用于调试
                return {
                    "success": False,
                    "error": "响应中未找到图片数据",
                    "response": data
                }
                
            except (KeyError, IndexError) as e:
                return {
                    "success": False,
                    "error": f"响应数据格式错误: {e}",
                    "response": data
                }
        else:
            return {
                "success": False,
                "error": f"HTTP {response.status_code}: {response.text}"
            }
    
    except requests.exceptions.Timeout:
        return {
            "success": False,
            "error": f"请求超时（超过 {TIMEOUT[resolution]} 秒）"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"请求失败: {str(e)}"
        }

def save_image(image_base64, filename):
    """
    保存 base64 图片到文件
    
    参数：
        image_base64: base64 编码的图片数据
        filename: 保存的文件名
    """
    try:
        # 将 base64 解码为二进制数据
        image_bytes = base64.b64decode(image_base64)
        
        # 写入文件
        with open(filename, "wb") as f:
            f.write(image_bytes)
        
        print(f"💾 图片已保存: {filename}")
        return True
    except Exception as e:
        print(f"❌ 保存失败: {e}")
        return False

# ============================================================================
# 示例 1: 单张图片生成（默认）
# ============================================================================

def example_single_image():
    """生成单张图片 - 使用配置区的设置"""
    print("\n" + "="*60)
    print("📸 示例 1: 生成单张图片")
    print("="*60)
    
    result = generate_image(
        prompt=CONFIG["prompt"],
        aspect_ratio=CONFIG["aspect_ratio"],
        resolution=CONFIG["resolution"]
    )
    
    if result["success"]:
        print(f"\n✅ 生成成功！")
        save_image(result["image_data"], CONFIG["output_file"])
    else:
        print(f"\n❌ 生成失败: {result['error']}")
        # 如果有响应数据，打印出来用于调试
        if "response" in result:
            print(f"\n🔍 调试信息（响应结构）:")
            import json
            print(json.dumps(result["response"], indent=2, ensure_ascii=False)[:500] + "...")

# ============================================================================
# 示例 2: 批量生成（可选）
# ============================================================================

def example_batch_generation():
    """批量生成多张图片 - 演示如何循环调用"""
    print("\n" + "="*60)
    print("📚 示例 2: 批量生成图片")
    print("="*60)
    
    # 定义要生成的图片列表
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    batch_tasks = [
        {
            "prompt": "一座灯塔矗立在海边，日落时分，橙红色的天空",
            "aspect_ratio": "16:9",
            "resolution": "2K",
            "filename": f"NanoBananaPro_batch_1_lighthouse_{timestamp}.png"
        },
        {
            "prompt": "森林中的小木屋，阳光透过树叶洒下，温馨宁静",
            "aspect_ratio": "4:3",
            "resolution": "2K",
            "filename": f"NanoBananaPro_batch_2_cabin_{timestamp}.png"
        },
        {
            "prompt": "未来主义城市夜景，霓虹灯，赛博朋克风格",
            "aspect_ratio": "21:9",
            "resolution": "2K",
            "filename": f"NanoBananaPro_batch_3_city_{timestamp}.png"
        }
    ]
    
    print(f"\n📋 共 {len(batch_tasks)} 个任务\n")
    
    success_count = 0
    for i, task in enumerate(batch_tasks, 1):
        print(f"\n--- 任务 {i}/{len(batch_tasks)} ---")
        
        result = generate_image(
            prompt=task["prompt"],
            aspect_ratio=task["aspect_ratio"],
            resolution=task["resolution"]
        )
        
        if result["success"]:
            save_image(result["image_data"], task["filename"])
            success_count += 1
        else:
            print(f"❌ 失败: {result['error']}")
        
        # 添加延迟，避免请求过快
        if i < len(batch_tasks):
            print("⏳ 等待 2 秒...")
            time.sleep(2)
    
    print(f"\n{'='*60}")
    print(f"✅ 批量生成完成: {success_count}/{len(batch_tasks)} 成功")
    print(f"{'='*60}")

# ============================================================================
# 主程序
# ============================================================================

def main():
    """主程序入口"""
    print("\n" + "="*60)
    print("Gemini 3 Pro Image - 文本生成图片")
    print("="*60)
    
    # 检查 API Key
    if API_KEY == "your-api-key-here":
        print("\n❌ 错误: 请先在代码顶部设置您的 API Key")
        print("   在 API_KEY 变量中填入您的密钥")
        return
    
    # 显示当前配置
    print("\n📋 当前配置:")
    print(f"   提示词: {CONFIG['prompt']}")
    print(f"   宽高比: {CONFIG['aspect_ratio']}")
    print(f"   分辨率: {CONFIG['resolution']}")
    print(f"   输出文件: {CONFIG['output_file']}")
    
    # 用户选择
    print("\n请选择运行模式:")
    print("  1. 生成单张图片 (默认)")
    print("  2. 批量生成示例")
    print("  0. 退出")
    
    try:
        choice = input("\n请输入选项 [1]: ").strip() or "1"
        
        if choice == "1":
            example_single_image()
        elif choice == "2":
            example_batch_generation()
        elif choice == "0":
            print("👋 再见!")
            return
        else:
            print("❌ 无效选项，将运行默认模式")
            example_single_image()
        
        print("\n" + "="*60)
        print("✅ 程序运行完成")
        print("="*60)
        
    except KeyboardInterrupt:
        print("\n\n⚠️  程序被用户中断")
    except Exception as e:
        print(f"\n\n❌ 程序出错: {e}")

if __name__ == "__main__":
    main()