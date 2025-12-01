# 听听音乐播放器

## 项目简介

听听音乐是一款简单易用的NAS音乐播放器，支持Web界面和API访问，可在手机和电脑上使用。

## 功能特性

- ✅ 支持音乐播放、暂停、上一曲、下一曲
- ✅ 支持列表循环、单曲循环、顺序播放、随机播放
- ✅ 支持歌词显示，自动滚动高亮当前歌词
- ✅ 支持音量调节和音效切换
- ✅ 支持播放列表管理
- ✅ 支持主题切换（深色/浅色）
- ✅ 支持响应式设计，适配手机和电脑
- ✅ 支持API访问，可用于第三方应用开发

## 技术栈

- **后端**：FastAPI + Python 3.10+
- **前端**：HTML + CSS + JavaScript
- **数据库**：SQLite
- **音频处理**：Mutagen
- **部署**：Docker

## 安装和运行

### 环境要求

- Python 3.10+
- pip
- Git

### 安装步骤

1. 克隆仓库
   ```bash
   git clone https://github.com/hswz-5525/tingtingmusic.git
   cd tingtingmusic
   ```

2. 创建虚拟环境
   ```bash
   python -m venv venv
   ```

3. 激活虚拟环境
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`

4. 安装依赖
   ```bash
   pip install -r requirements.txt
   ```

5. 配置音乐目录
   ```bash
   # 修改.env文件，设置MUSIC_DIR为你的音乐目录
   MUSIC_DIR=./musics
   ```

6. 运行应用
   ```bash
   python -m app.backend.main
   ```

7. 访问应用
   - Web界面：http://localhost:18000
   - API文档：http://localhost:18000/docs

### 使用Docker运行

1. 构建Docker镜像
   ```bash
   docker build -t tingtingmusic .
   ```

2. 运行Docker容器
   ```bash
   docker run -d -p 18000:18000 -v /path/to/music:/app/musics tingtingmusic
   ```

## 使用说明

### 基本操作

1. **播放/暂停**：点击播放按钮
2. **上一曲/下一曲**：点击上一曲/下一曲按钮
3. **音量调节**：拖动音量滑块
4. **音效切换**：点击音效按钮，选择喜欢的音效
5. **播放模式切换**：点击播放模式按钮，切换播放模式
6. **主题切换**：点击主题切换按钮，切换深色/浅色主题

### 播放列表管理

1. **新建播放列表**：点击"+ 新建"按钮，输入播放列表名称
2. **选择播放列表**：点击左侧播放列表名称，切换播放列表
3. **删除播放列表**：点击播放列表右侧的删除按钮

### 歌词显示

- 歌词会自动滚动，高亮显示当前歌词
- 支持手动滚动歌词
- 歌词会自动居中显示当前歌词行

## 项目结构

```
tingtingmusic/
├── app/
│   ├── backend/          # 后端代码
│   │   ├── config.py     # 配置文件
│   │   ├── crud.py        # 数据库操作
│   │   ├── main.py        # 主程序
│   │   ├── models.py      # 数据模型
│   │   ├── music_scanner.py # 音乐扫描
│   │   └── schemas.py     # 数据模式
│   ├── static/           # 静态资源
│   │   ├── app.js         # 前端JavaScript
│   │   ├── styles.css     # 样式文件
│   │   └── default-cover.png # 默认封面
│   └── templates/        # HTML模板
│       ├── index.html     # 主页面
│       ├── settings.html  # 设置页面
│       ├── mobile.html    # 手机端页面
│       └── mobile_settings.html # 手机端设置页面
├── .env                  # 环境变量
├── .gitignore            # Git忽略文件
├── Dockerfile            # Dockerfile
├── requirements.txt       # 依赖列表
└── README.md             # 项目说明
```

## 配置说明

### 环境变量

| 变量名 | 默认值 | 说明 |
|-------|-------|------|
| MUSIC_DIR | ./musics | 音乐目录 |
| HOST | 0.0.0.0 | 服务器地址 |
| PORT | 18000 | 服务器端口 |
| DATABASE_URL | sqlite:///./music.db | 数据库连接URL |

### 配置文件

配置文件位于 `.env`，可以根据需要修改。

## API文档

### 基本信息

- API地址：http://localhost:18000/api
- API文档：http://localhost:18000/docs
- 支持CORS，可用于第三方应用开发

### 主要API

- `GET /api/tracks` - 获取所有歌曲
- `GET /api/tracks/{id}/stream` - 播放歌曲
- `GET /api/tracks/{id}/lyric` - 获取歌词
- `GET /api/playlists` - 获取所有播放列表
- `POST /api/playlists` - 创建播放列表
- `DELETE /api/playlists/{id}` - 删除播放列表

## 贡献指南

欢迎提交Issue和Pull Request！

### 开发流程

1. Fork仓库
2. 创建分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m "Add your feature"`
4. 推送分支：`git push origin feature/your-feature`
5. 创建Pull Request

### 代码规范

- 遵循PEP 8规范
- 使用类型注解
- 添加适当的注释
- 编写测试用例

## 许可证

MIT License

## 更新日志

### v1.0.1 (2025-12-01)
- 修复手机端歌词滚动问题
- 优化歌词显示效果
- 更新版本号

### v1.0.0 (2025-11-30)
- 初始版本发布
- 支持音乐播放和歌词显示
- 支持播放列表管理
- 支持主题切换
- 支持响应式设计

## 联系方式

- GitHub: https://github.com/hswz-5525/tingtingmusic
- 邮箱: your-email@example.com

## 致谢

感谢所有为项目做出贡献的开发者！

## 免责声明

本项目仅供学习和个人使用，请勿用于商业用途。

## 许可证

[MIT License](LICENSE)

