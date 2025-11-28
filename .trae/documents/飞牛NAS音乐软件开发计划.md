# 飞牛NAS音乐软件开发计划（含无损音乐支持）

## 技术栈选择
- **后端**：Python + FastAPI（高性能API框架）
- **前端**：HTML5 + CSS3 + JavaScript（响应式设计，适配手机浏览器）
- **数据库**：SQLite（轻量级，适合NAS环境）
- **容器化**：Docker
- **音乐处理**：mutagen（元数据解析）、ffmpeg（可选，用于格式转换或流处理）

## 项目结构
```
├── app/                  # 主应用目录
│   ├── backend/          # 后端代码
│   │   ├── main.py       # FastAPI主入口
│   │   ├── models.py     # 数据模型
│   │   ├── schemas.py    # 数据验证
│   │   ├── crud.py       # 数据库操作
│   │   ├── utils.py      # 工具函数
│   │   ├── config.py     # 配置文件
│   │   └── music_scanner.py # 音乐文件扫描和元数据解析
│   ├── frontend/         # 前端代码
│   │   ├── index.html    # 主页面
│   │   ├── styles.css    # 样式文件
│   │   └── app.js        # JavaScript逻辑
│   ├── static/           # 静态资源
│   └── templates/        # HTML模板
├── docker/               # Docker相关文件
│   └── docker-compose.yml # Docker Compose配置
├── test/                 # 测试文件
├── .env.example          # 环境变量示例
├── Dockerfile            # Docker构建文件
├── requirements.txt      # Python依赖
└── README.md             # 项目说明
```

## 核心功能实现

### 1. 音乐文件管理
- 扫描指定目录下的音乐文件，支持常见格式：
  - 有损格式：MP3, AAC, OGG
  - 无损格式：FLAC, ALAC, WAV, AIFF
- 使用mutagen库解析音乐元数据（标题、艺术家、专辑、时长、采样率、比特率等）
- 支持读取专辑封面
- 存储到SQLite数据库

### 2. API接口设计
- `GET /api/tracks` - 获取音乐列表（支持分页、过滤）
- `GET /api/tracks/{id}` - 获取单首音乐详情
- `GET /api/tracks/{id}/stream` - 音乐流输出（支持无损格式直接流传输）
- `GET /api/artists` - 获取艺术家列表
- `GET /api/albums` - 获取专辑列表
- `GET /api/scan` - 手动触发音乐扫描

### 3. Web播放器界面
- 响应式设计，适配手机和桌面浏览器
- 音乐列表展示，支持按艺术家、专辑筛选
- 播放控制（播放/暂停、上一首/下一首、音量调节）
- 进度条控制
- 专辑封面展示
- 支持无损音乐播放（利用HTML5 Audio API的无损格式支持）

### 4. Docker部署
- 编写Dockerfile，包含所有依赖
- Docker Compose配置，支持挂载音乐目录
- 支持环境变量配置（音乐目录、端口等）

## 实现步骤
1. 创建项目基础结构
2. 编写后端API框架和数据模型
3. 实现音乐文件扫描和元数据解析（支持无损格式）
4. 开发Web播放器界面，确保支持无损音乐播放
5. 实现音乐流输出功能，支持各种格式
6. 编写Docker配置文件
7. 测试和调试

## 关键特性
- 轻量级设计，适合NAS环境
- 响应式界面，适配各种设备
- 高性能API，支持并发访问
- 全面支持无损音乐格式
- 易于部署和配置
- 自动扫描音乐文件

## 后续扩展
- 音乐搜索功能
- 播放列表管理
- 用户认证
- 歌词显示
- 音乐推荐
- 支持更多无损格式