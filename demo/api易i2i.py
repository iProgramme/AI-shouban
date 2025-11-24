#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Gemini 图片编辑工具 - Python版本（简化版）
上传本地图片 + 文字描述，生成新图片，支持自定义纵横比
"""

import requests
import base64
import os
import datetime
import mimetypes
from typing import Optional, Tuple

class GeminiImageEditor:
    """Gemini 图片编辑器"""

    # 支持的纵横比
    SUPPORTED_ASPECT_RATIOS = [
        "21:9", "16:9", "4:3", "3:2", "1:1",
        "9:16", "3:4", "2:3", "5:4", "4:5"
    ]

    def __init__(self, api_key: str,
                 api_url: str = "https://api.apiyi.com/v1beta/models/gemini-3-pro-image-preview:generateContent"):
        """
        初始化图片编辑器

        参数:
            api_key: API密钥
            api_url: API地址（使用 Google 原生 Gemini API）
        """
        self.api_key = api_key
        self.api_url = api_url
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }

    def edit_image(self, image_path: str, prompt: str,
                   aspect_ratio: Optional[str] = "1:1",
                   output_dir: str = ".") -> Tuple[bool, str]:
        """
        编辑图片并生成新图片

        参数:
            image_path: 输入图片路径
            prompt: 编辑描述（提示词）
            aspect_ratio: 纵横比，如 "16:9", "1:1" 等（默认 1:1）
            output_dir: 保存目录（默认当前目录）

        返回:
            (是否成功, 结果消息)
        """
        print(f"🚀 开始编辑图片...")
        print(f"📁 输入图片: {image_path}")
        print(f"📝 编辑描述: {prompt}")
        print(f"📐 纵横比: {aspect_ratio}")

        # 检查图片文件是否存在
        if not os.path.exists(image_path):
            return False, f"图片文件不存在: {image_path}"

        # 验证纵横比
        if aspect_ratio and aspect_ratio not in self.SUPPORTED_ASPECT_RATIOS:
            return False, f"不支持的纵横比 {aspect_ratio}。支持: {', '.join(self.SUPPORTED_ASPECT_RATIOS)}"

        # 读取并编码图片
        try:
            with open(image_path, 'rb') as f:
                image_data = f.read()
            image_base64 = base64.b64encode(image_data).decode('utf-8')

            # 检测图片类型
            mime_type, _ = mimetypes.guess_type(image_path)
            if not mime_type or not mime_type.startswith('image/'):
                mime_type = 'image/jpeg'  # 默认
            print(f"🎨 图片类型: {mime_type}")

        except Exception as e:
            return False, f"读取图片失败: {str(e)}"

        # 生成输出文件名
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = os.path.join(output_dir, f"gemini_edited_{timestamp}.png")

        try:
            # 构建请求数据（Google 原生格式）
            payload = {
                "contents": [{
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": image_base64
                            }
                        }
                    ]
                }]
            }

            # 添加纵横比配置
            if aspect_ratio:
                payload["generationConfig"] = {
                    "responseModalities": ["IMAGE"],
                    "imageConfig": {
                        "aspectRatio": aspect_ratio
                    }
                }

            print("📡 发送请求到 Gemini API...")

            # 发送请求
            response = requests.post(
                self.api_url,
                headers=self.headers,
                json=payload,
                timeout=120
            )

            if response.status_code != 200:
                return False, f"API 请求失败，状态码: {response.status_code}"

            # 解析响应
            result = response.json()

            # 提取图片数据
            if "candidates" not in result or len(result["candidates"]) == 0:
                return False, "未找到图片数据"

            candidate = result["candidates"][0]
            if "content" not in candidate or "parts" not in candidate["content"]:
                return False, "响应格式错误"

            parts = candidate["content"]["parts"]
            output_image_data = None

            for part in parts:
                if "inlineData" in part and "data" in part["inlineData"]:
                    output_image_data = part["inlineData"]["data"]
                    break

            if not output_image_data:
                return False, "未找到图片数据"

            # 解码并保存图片
            print("💾 正在保存图片...")
            decoded_data = base64.b64decode(output_image_data)

            os.makedirs(os.path.dirname(output_file) if os.path.dirname(output_file) else ".", exist_ok=True)

            with open(output_file, 'wb') as f:
                f.write(decoded_data)

            file_size = len(decoded_data) / 1024  # KB
            print(f"✅ 图片已保存: {output_file}")
            print(f"📊 文件大小: {file_size:.2f} KB")

            return True, f"成功保存图片: {output_file}"

        except requests.exceptions.Timeout:
            return False, "请求超时（120秒）"
        except requests.exceptions.ConnectionError:
            return False, "网络连接错误"
        except Exception as e:
            return False, f"错误: {str(e)}"

def main():
    """主函数 - 使用示例"""

    # ========== 配置区 ==========
    # 1. 设置你的 API 密钥
    API_KEY = "sk-"

    # 2. 输入图片路径
    INPUT_IMAGE = "./dog.png"  # 替换为你的图片路径

    # 3. 输入编辑描述（提示词）
    PROMPT = "生成图片：增加一只帅气的猫咪在狗狗的旁边，不改变原有的图片的结构"

    # 4. 选择纵横比（可选）
    # 支持: 21:9, 16:9, 4:3, 3:2, 1:1, 9:16, 3:4, 2:3, 5:4, 4:5
    ASPECT_RATIO = "9:16"  # 竖屏
    # ASPECT_RATIO = "1:1"   # 正方形
    # ASPECT_RATIO = "9:16"  # 竖屏

    # 5. 设置保存目录（可选）
    OUTPUT_DIR = "."  # 当前目录
    # ============================

    print("="*60)
    print("Gemini 图片编辑工具")
    print("="*60)
    print(f"⏰ 开始时间: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)

    # 创建编辑器并编辑图片
    editor = GeminiImageEditor(API_KEY)
    success, message = editor.edit_image(
        image_path=INPUT_IMAGE,
        prompt=PROMPT,
        aspect_ratio=ASPECT_RATIO,
        output_dir=OUTPUT_DIR
    )

    # 显示结果
    print("\n" + "="*60)
    if success:
        print("🎉 编辑成功！")
        print(f"✅ {message}")
    else:
        print("❌ 编辑失败")
        print(f"💥 {message}")
        print("\n建议检查:")
        print("  1. API 密钥是否正确")
        print("  2. 图片路径是否正确")
        print("  3. 网络连接是否正常")
        print("  4. 提示词是否合理")

    print(f"⏰ 结束时间: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)

if __name__ == "__main__":
    main()
