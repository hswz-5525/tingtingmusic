from PIL import Image, ImageDraw, ImageFont
import os
import math

# 创建默认封面
width, height = 300, 300
image = Image.new('RGB', (width, height), color='#121212')
draw = ImageDraw.Draw(image)

# 绘制CD外圈
draw.ellipse([(10, 10), (290, 290)], fill='#222')

# 绘制CD内圈
draw.ellipse([(30, 30), (270, 270)], fill='#333')

# 绘制CD中心
draw.ellipse([(120, 120), (180, 180)], fill='#1db954')

# 绘制CD中心内圈
draw.ellipse([(135, 135), (165, 165)], fill='#121212')

# 绘制放射状线条
for i in range(36):
    angle = (i * 10) * 3.14159 / 180
    x1, y1 = 150, 150
    x2 = 150 + int(120 * math.cos(angle))
    y2 = 150 + int(120 * math.sin(angle))
    draw.line([(x1, y1), (x2, y2)], fill='#444', width=1)

# 绘制文字
try:
    font = ImageFont.truetype('arial.ttf', 24)
except:
    font = ImageFont.load_default()

draw.text((150, 140), "听听音乐", fill='#ffffff', font=font, anchor='mm')

# 绘制英文文字
try:
    font_small = ImageFont.truetype('arial.ttf', 16)
except:
    font_small = ImageFont.load_default()

draw.text((150, 170), "TINGTING MUSIC", fill='#ffffff', font=font_small, anchor='mm')

# 保存图片
save_dir = 'app/static'
os.makedirs(save_dir, exist_ok=True)
image.save(os.path.join(save_dir, 'default-cover.png'))

print("默认封面已生成并保存到 app/static/default-cover.png")