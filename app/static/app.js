// 音乐播放器类
class MusicPlayer {
    constructor() {
        this.audio = new Audio();
        this.tracks = [];
        this.playlists = [];
        this.currentPlaylist = null;
        this.currentTrackIndex = -1;
        this.isPlaying = false;
        this.lyrics = [];
        this.currentLyricIndex = -1;
        
        // 播放模式：0-顺序播放, 1-单曲循环, 2-列表循环, 3-随机播放
        this.playMode = 2; // 默认列表循环
        this.playModeIcons = ['▶️', '🔂', '🔄', '🔀'];
        
        // DOM元素
        this.elements = {
            playBtn: document.getElementById('play-btn'),
            prevBtn: document.getElementById('prev-btn'),
            nextBtn: document.getElementById('next-btn'),
            playModeBtn: document.getElementById('play-mode-btn'),
            playModeIcon: document.getElementById('play-mode-icon'),
            progress: document.querySelector('.progress'),
            currentTime: document.getElementById('current-time'),
            totalTime: document.getElementById('total-time'),
            trackTitle: document.getElementById('track-title'),
            trackArtist: document.getElementById('track-artist'),
            volume: document.getElementById('volume'),
            playlistsList: document.getElementById('playlists-list'),
            addPlaylistBtn: document.getElementById('add-playlist-btn'),
            lyrics: document.getElementById('lyrics'),
            tracksList: document.getElementById('tracks-list'),
            currentListTitle: document.getElementById('current-list-title'),
            equalizerBtn: document.getElementById('equalizer-btn'),
            equalizerMenu: document.getElementById('equalizer-menu'),
            themeToggleBtn: document.getElementById('theme-toggle-btn')
        };
        
        // 播放列表展开状态
        this.expandedPlaylists = new Set();
        
        // 音效设置
        this.currentEffect = '原声';
        
        // 主题设置
        this.isDarkTheme = true;
        
        this.init();
    }
    
    async init() {
        // 加载设置
        this.loadSettings();
        
        // 加载音乐列表和播放列表
        await Promise.all([
            this.loadTracks(),
            this.loadPlaylists()
        ]);
        
        // 绑定事件
        this.bindEvents();
        
        // 设置默认音量
        this.audio.volume = this.elements.volume.value;
        
        // 设置初始播放模式图标
        this.updatePlayModeIcon();
        
        // 加载主题设置
        this.loadThemeSetting();
    }
    
    // 加载设置
    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('tingting-music-settings') || '{}');
        
        // 应用设置
        if (settings.defaultPlayMode !== undefined) {
            this.playMode = settings.defaultPlayMode;
        }
        
        if (settings.defaultVolume !== undefined) {
            const volume = settings.defaultVolume / 100;
            this.audio.volume = volume;
            this.elements.volume.value = volume;
        }
        
        // 保存设置到实例中
        this.settings = {
            showArtist: settings.showArtist !== undefined ? settings.showArtist : 'true',
            showAlbum: settings.showAlbum !== undefined ? settings.showAlbum : 'true',
            showFilename: settings.showFilename !== undefined ? settings.showFilename : 'true',
            showBitrate: settings.showBitrate !== undefined ? settings.showBitrate : 'true',
            showSampleRate: settings.showSampleRate !== undefined ? settings.showSampleRate : 'true',
            showFileType: settings.showFileType !== undefined ? settings.showFileType : 'true'
        };
    }
    
    async loadTracks() {
        try {
            const response = await fetch('/api/tracks');
            this.tracks = await response.json();
            // 更新当前列表标题
            const allMusicPlaylist = this.playlists.find(pl => pl.type === 'all');
            if (allMusicPlaylist) {
                this.elements.currentListTitle.textContent = allMusicPlaylist.name;
            } else {
                this.elements.currentListTitle.textContent = '全部音乐';
            }
            this.renderTracks();
        } catch (error) {
            console.error('加载音乐列表失败:', error);
        }
    }
    
    async loadPlaylists() {
        try {
            const response = await fetch('/api/playlists');
            this.playlists = await response.json();
            console.log('加载到的播放列表数据:', this.playlists);
            this.renderPlaylists();
        } catch (error) {
            console.error('加载播放列表失败:', error);
        }
    }
    
    renderTracks() {
        // 清空容器
        this.elements.tracksList.innerHTML = '';
        
        // 渲染歌曲列表
        this.tracks.forEach((track, index) => {
            const trackItem = document.createElement('div');
            trackItem.className = `track-item ${this.currentTrackIndex === index ? 'active' : ''}`;
            trackItem.dataset.index = index;
            
            // 获取文件名
            const fileName = track.file_path.split('/').pop().split('\\').pop();
            const fileNameWithoutExt = fileName.split('.').slice(0, -1).join('.');
            
            // 构建显示信息
            let displayName = track.title;
            let details = [];
            
            // 根据设置添加艺术家
            if (this.settings.showArtist === 'true' && track.artist) {
                displayName += ` - ${track.artist.name}`;
            }
            
            // 根据设置添加专辑名
            if (this.settings.showAlbum === 'true' && track.album) {
                details.push(`专辑: ${track.album.title}`);
            }
            
            // 根据设置添加文件名
            if (this.settings.showFilename === 'true') {
                details.push(`文件名: ${fileNameWithoutExt}`);
            }
            
            // 根据设置添加编码率
            if (this.settings.showBitrate === 'true' && track.bitrate) {
                details.push(`${Math.round(track.bitrate / 1000)}kbps`);
            }
            
            // 根据设置添加采样率
            if (this.settings.showSampleRate === 'true' && track.sample_rate) {
                details.push(`${Math.round(track.sample_rate / 1000)}kHz`);
            }
            
            // 根据设置添加文件格式
            if (this.settings.showFileType === 'true') {
                details.push(`${track.file_type.toUpperCase()}`);
            }
            
            const trackDetails = details.length > 0 ? details.join(' · ') : '';
            
            trackItem.innerHTML = `
                <div class="track-number">${index + 1}</div>
                <div class="track-details">
                    <h3>${displayName}</h3>
                    ${trackDetails ? `<div class="track-info">${trackDetails}</div>` : ''}
                </div>
                <div class="track-duration">${this.formatTime(track.duration)}</div>
            `;
            
            // 绑定点击事件
            trackItem.addEventListener('click', () => this.playTrack(index));
            
            this.elements.tracksList.appendChild(trackItem);
        });
    }
    
    renderPlaylists() {
        console.log('渲染播放列表，当前播放列表数据:', this.playlists);
        this.elements.playlistsList.innerHTML = '';
        
        // 分离默认播放列表和自定义播放列表
        const defaultPlaylists = this.playlists.filter(pl => pl.type !== 'custom');
        const customPlaylists = this.playlists.filter(pl => pl.type === 'custom');
        
        // 对默认播放列表进行排序：全部音乐 -> 我的收藏 -> 最近播放
        defaultPlaylists.sort((a, b) => {
            const order = ['all', 'favorite', 'recent'];
            return order.indexOf(a.type) - order.indexOf(b.type);
        });
        
        // 添加默认播放列表
        if (defaultPlaylists.length > 0) {
            defaultPlaylists.forEach(playlist => {
                this.renderPlaylistItem(playlist);
            });
        }
        
        // 添加自定义播放列表
        if (customPlaylists.length > 0) {
            customPlaylists.forEach(playlist => {
                this.renderPlaylistItem(playlist);
            });
        }
    }
    
    renderPlaylistItem(playlist) {
        const playlistItem = document.createElement('div');
        playlistItem.className = 'playlist-item';
        playlistItem.dataset.id = playlist.id;
        
        const actionsHtml = playlist.type === 'custom' ? 
            `<button class="delete-playlist-btn" title="删除">🗑️</button>` : '';
        
        playlistItem.innerHTML = `
            <div class="playlist-name">${playlist.name}</div>
            <div class="playlist-actions">
                ${actionsHtml}
            </div>
        `;
        
        // 绑定点击事件
        playlistItem.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-playlist-btn')) {
                this.selectPlaylist(playlist.id);
            }
        });
        
        // 绑定删除事件
        const deleteBtn = playlistItem.querySelector('.delete-playlist-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deletePlaylist(playlist.id);
            });
        }
        
        this.elements.playlistsList.appendChild(playlistItem);
    }
    
    renderPlaylistTracks(playlistId, container) {
        // 清空容器
        container.innerHTML = '';
        
        // 获取当前播放列表的歌曲
        let tracks = [];
        if (playlistId === 'all') {
            tracks = this.tracks;
        } else {
            // 这里需要从API获取播放列表的歌曲，暂时使用模拟数据
            // 实际实现需要调用API获取播放列表的歌曲
            tracks = this.tracks.slice(0, 5); // 只显示前5首
        }
        
        // 渲染歌曲列表
        tracks.forEach((track, index) => {
            const trackItem = document.createElement('div');
            trackItem.className = `playlist-track-item ${this.currentTrackIndex === index ? 'active' : ''}`;
            trackItem.dataset.index = index;
            
            // 获取文件名
            const fileName = track.file_path.split('/').pop().split('\\').pop();
            const fileNameWithoutExt = fileName.split('.').slice(0, -1).join('.');
            
            // 构建显示信息
            let displayName = track.title;
            let details = [];
            
            // 根据设置添加艺术家
            if (this.settings.showArtist === 'true' && track.artist) {
                displayName += ` - ${track.artist.name}`;
            }
            
            // 根据设置添加文件名
            if (this.settings.showFilename === 'true') {
                details.push(`(${fileNameWithoutExt})`);
            }
            
            // 根据设置添加编码率
            if (this.settings.showBitrate === 'true' && track.bitrate) {
                details.push(`${Math.round(track.bitrate / 1000)}kbps`);
            }
            
            // 根据设置添加采样率
            if (this.settings.showSampleRate === 'true' && track.sample_rate) {
                details.push(`${Math.round(track.sample_rate / 1000)}kHz`);
            }
            
            if (details.length > 0) {
                displayName += ` ${details.join(' · ')}`;
            }
            
            trackItem.textContent = displayName;
            trackItem.addEventListener('click', () => this.playTrack(index));
            container.appendChild(trackItem);
        });
    }
    
    togglePlaylistTracks(container, expandBtn) {
        if (container.style.display === 'none' || container.style.display === '') {
            container.style.display = 'block';
            expandBtn.textContent = '▲';
        } else {
            container.style.display = 'none';
            expandBtn.textContent = '▼';
        }
    }
    
    bindEvents() {
        // 播放/暂停按钮
        this.elements.playBtn.addEventListener('click', () => this.togglePlay());
        
        // 上一首/下一首按钮
        this.elements.prevBtn.addEventListener('click', () => this.playPrevious());
        this.elements.nextBtn.addEventListener('click', () => this.playNext());
        
        // 播放模式按钮
        this.elements.playModeBtn.addEventListener('click', () => this.togglePlayMode());
        
        // 进度条点击
        this.elements.progress.addEventListener('click', (e) => this.seek(e));
        
        // 音量控制
        this.elements.volume.addEventListener('input', (e) => {
            this.audio.volume = e.target.value;
        });
        
        // 音频事件
        this.audio.addEventListener('timeupdate', () => {
            this.updateProgress();
            this.updateLyrics();
        });
        this.audio.addEventListener('ended', () => this.playNext());
        this.audio.addEventListener('loadedmetadata', () => {
            this.elements.totalTime.textContent = this.formatTime(this.audio.duration);
        });
        
        // 播放列表事件
        this.elements.addPlaylistBtn.addEventListener('click', () => this.createPlaylist());
        
        // 音效控制事件
        this.elements.equalizerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleEqualizerMenu();
        });
        
        // 音效菜单项点击事件
        document.querySelectorAll('.equalizer-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const effect = e.currentTarget.dataset.effect;
                this.selectEffect(effect);
            });
        });
        
        // 点击页面其他地方关闭音效菜单
        document.addEventListener('click', () => {
            this.elements.equalizerMenu.classList.remove('show');
        });
        
        // 阻止菜单内部点击事件冒泡
        this.elements.equalizerMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // 主题切换事件
        this.elements.themeToggleBtn.addEventListener('click', () => {
            this.toggleTheme();
        });
    }
    
    // 切换播放模式
    togglePlayMode() {
        this.playMode = (this.playMode + 1) % 4;
        this.updatePlayModeIcon();
        
        // 更新按钮title
        const modeTitles = ['顺序播放', '单曲循环', '列表循环', '随机播放'];
        this.elements.playModeBtn.title = `当前: ${modeTitles[this.playMode]}`;
    }
    
    // 更新播放模式图标
    updatePlayModeIcon() {
        this.elements.playModeIcon.textContent = this.playModeIcons[this.playMode];
    }
    
    togglePlay() {
        if (this.currentTrackIndex === -1 && this.tracks.length > 0) {
            // 首次播放，从第一首开始
            this.playTrack(0);
        } else if (this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
            this.updateCDRotation();
        } else {
            this.audio.play();
            this.isPlaying = true;
            this.updateCDRotation();
        }
        this.updatePlayButton();
    }
    
    async playTrack(index) {
        if (index < 0 || index >= this.tracks.length) return;
        
        this.currentTrackIndex = index;
        const track = this.tracks[index];
        
        // 暂停当前播放
        if (this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
        }
        
        // 更新UI
        this.updateTrackInfo(track);
        this.updateActiveTrack();
        
        // 更新专辑封面
        this.updateAlbumCover(track.id);
        
        // 设置音频源（不立即播放）
        this.audio.src = `/api/tracks/${track.id}/stream`;
        this.audio.currentTime = 0;
        
        // 重置歌词状态
        this.currentLyricIndex = -1;
        
        try {
            // 预加载歌词
            await this.loadLyrics(track.id);
            
            // 确保歌词已渲染完成
            await this.ensureLyricsRendered();
            
            // 延迟歌词更新以避免初始滚动
            setTimeout(() => {
                if (this.lyrics.length > 0) {
                    // 手动更新歌词，确保第一行高亮但不滚动
                    this.updateLyrics(true); // 传递参数表示这是初始化
                }
            }, 100);
            
        } catch (error) {
            console.error('加载歌词失败:', error);
            this.lyrics = [];
            this.renderLyrics();
        }
        
        // 开始播放
        this.audio.play();
        this.isPlaying = true;
        this.updatePlayButton();
        this.updateCDRotation();
    }
    
    // 更新CD旋转状态
    updateCDRotation() {
        const coverImage = document.getElementById('cover-image');
        if (this.isPlaying) {
            coverImage.classList.add('rotate');
        } else {
            coverImage.classList.remove('rotate');
        }
    }
    
    playPrevious() {
        if (this.tracks.length === 0) return;
        
        let newIndex;
        
        switch (this.playMode) {
            case 3: // 随机播放
                newIndex = Math.floor(Math.random() * this.tracks.length);
                break;
            default: // 其他模式统一处理
                newIndex = this.currentTrackIndex <= 0 ? this.tracks.length - 1 : this.currentTrackIndex - 1;
        }
        
        this.playTrack(newIndex);
    }
    
    playNext() {
        if (this.tracks.length === 0) return;
        
        let newIndex;
        
        switch (this.playMode) {
            case 0: // 顺序播放
                newIndex = this.currentTrackIndex + 1;
                if (newIndex >= this.tracks.length) {
                    // 播放完毕，停止播放
                    this.audio.pause();
                    this.isPlaying = false;
                    this.updatePlayButton();
                    return;
                }
                break;
            case 1: // 单曲循环
                newIndex = this.currentTrackIndex;
                break;
            case 2: // 列表循环
                newIndex = (this.currentTrackIndex + 1) % this.tracks.length;
                break;
            case 3: // 随机播放
                newIndex = Math.floor(Math.random() * this.tracks.length);
                break;
            default:
                newIndex = (this.currentTrackIndex + 1) % this.tracks.length;
        }
        
        this.playTrack(newIndex);
    }
    
    updateProgress() {
        const { currentTime, duration } = this.audio;
        if (duration) {
            const progressPercent = (currentTime / duration) * 100;
            this.elements.progress.style.background = `linear-gradient(to right, #1db954 ${progressPercent}%, #333 ${progressPercent}%)`;
            
            // 更新当前时间
            this.elements.currentTime.textContent = this.formatTime(currentTime);
        }
    }
    
    seek(e) {
        const progressWidth = this.elements.progress.clientWidth;
        const clickX = e.offsetX;
        const duration = this.audio.duration;
        
        this.audio.currentTime = (clickX / progressWidth) * duration;
    }
    
    updateTrackInfo(track) {
        this.elements.trackTitle.textContent = track.title;
        this.elements.trackArtist.textContent = track.artist ? track.artist.name : '未知艺术家';
    }
    
    updateActiveTrack() {
        // 移除所有active类
        document.querySelectorAll('.track-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // 添加active类到当前播放的歌曲
        const currentTrackElement = document.querySelector(`[data-index="${this.currentTrackIndex}"]`);
        if (currentTrackElement) {
            currentTrackElement.classList.add('active');
        }
    }
    
    updatePlayButton() {
        const playIcon = this.elements.playBtn.querySelector('span');
        if (this.isPlaying) {
            playIcon.textContent = '⏸️';
        } else {
            playIcon.textContent = '▶️';
        }
    }
    
    updateAlbumCover(trackId) {
        const coverImage = document.getElementById('cover-image');
        coverImage.src = `/api/tracks/${trackId}/cover`;
        coverImage.onload = () => {
            // 图片加载成功
        };
        coverImage.onerror = () => {
            // 图片加载失败，使用默认封面
            coverImage.src = '/static/default-cover.png';
        };
    }
    
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    // 播放列表相关方法
    async selectPlaylist(playlistId) {
        // 更新播放列表选中状态
        document.querySelectorAll('.playlist-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-id="${playlistId}"]`).classList.add('active');
        
        // 获取当前播放列表
        const playlist = this.playlists.find(pl => pl.id === playlistId);
        
        if (playlist && playlist.type === 'all') {
            // 显示所有音乐
            this.currentPlaylist = null;
            this.elements.currentListTitle.textContent = playlist.name;
            await this.loadTracks();
        } else {
            // 显示播放列表中的音乐
            this.currentPlaylist = playlistId;
            await this.loadPlaylistTracks(playlistId);
        }
    }
    
    async loadPlaylistTracks(playlistId) {
        try {
            const response = await fetch(`/api/playlists/${playlistId}`);
            const playlist = await response.json();
            this.tracks = playlist.tracks;
            this.elements.currentListTitle.textContent = playlist.name;
            this.renderTracks();
        } catch (error) {
            console.error('加载播放列表失败:', error);
        }
    }
    
    async createPlaylist() {
        const name = prompt('请输入播放列表名称:');
        if (!name || name.trim() === '') return;
        
        try {
            const response = await fetch('/api/playlists', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: name.trim() })
            });
            
            if (response.ok) {
                await this.loadPlaylists();
            }
        } catch (error) {
            console.error('创建播放列表失败:', error);
        }
    }
    
    async deletePlaylist(playlistId) {
        // 检查是否为默认播放列表
        const playlist = this.playlists.find(pl => pl.id === playlistId);
        if (playlist && playlist.type !== 'custom') {
            alert('默认播放列表不能删除');
            return;
        }
        
        if (!confirm('确定要删除这个播放列表吗?')) return;
        
        try {
            const response = await fetch(`/api/playlists/${playlistId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                await this.loadPlaylists();
                // 如果当前选中的是被删除的播放列表，切换到全部音乐
                if (this.currentPlaylist === playlistId) {
                    this.selectPlaylist('all');
                }
            }
        } catch (error) {
            console.error('删除播放列表失败:', error);
        }
    }
    
    // 音效控制方法
    toggleEqualizerMenu() {
        this.elements.equalizerMenu.classList.toggle('show');
    }
    
    selectEffect(effect) {
        // 更新当前音效
        this.currentEffect = effect;
        
        // 更新按钮文本
        this.elements.equalizerBtn.textContent = effect;
        
        // 更新菜单项激活状态
        document.querySelectorAll('.equalizer-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.effect === effect) {
                item.classList.add('active');
            }
        });
        
        // 关闭菜单
        this.elements.equalizerMenu.classList.remove('show');
        
        // 应用音效（这里只是一个示例，实际应用需要根据音效类型设置不同的音频参数）
        this.applyEffect(effect);
    }
    
    applyEffect(effect) {
        // 这里需要根据不同的音效类型设置不同的音频参数
        // 由于浏览器原生Audio API不支持复杂音效，实际应用中可能需要使用Web Audio API
        // 这里只是一个示例，演示如何根据音效类型调整音频参数
        console.log(`应用音效: ${effect}`);
        
        // 示例：根据不同音效调整音量曲线或其他参数
        // 实际应用中需要使用Web Audio API实现复杂音效
        switch (effect) {
            case '超重低音':
                // 示例：增加低频增益
                break;
            case '纯净人声':
                // 示例：提升中频，降低高低频
                break;
            case 'HiFi现场':
                // 示例：平衡各频段，提升清晰度
                break;
            case '黑胶唱片':
                // 示例：模拟黑胶唱片的温暖音色
                break;
            case '演唱会':
                // 示例：增加混响效果
                break;
            case '3D丽音':
                // 示例：模拟3D环绕效果
                break;
            case '空间音效':
                // 示例：模拟空间环绕效果
                break;
            case '3D旋转':
                // 示例：模拟3D旋转音效
                break;
            case '声乐古风':
                // 示例：调整音色适合古风音乐
                break;
            case '5.1全景':
                // 示例：模拟5.1全景声效果
                break;
            case '虚拟环境':
                // 示例：模拟不同环境的音效
                break;
            case '原声':
            default:
                // 示例：恢复原始音效
                break;
        }
    }
    
    // 主题切换方法
    toggleTheme() {
        // 切换主题状态
        this.isDarkTheme = !this.isDarkTheme;
        
        // 更新body类名
        const body = document.body;
        if (this.isDarkTheme) {
            body.classList.remove('light-theme');
            this.elements.themeToggleBtn.textContent = '🌙';
        } else {
            body.classList.add('light-theme');
            this.elements.themeToggleBtn.textContent = '☀️';
        }
        
        // 保存主题设置到localStorage
        this.saveThemeSetting();
    }
    
    // 保存主题设置
    saveThemeSetting() {
        const settings = JSON.parse(localStorage.getItem('tingting-music-settings') || '{}');
        settings.theme = this.isDarkTheme ? 'dark' : 'light';
        localStorage.setItem('tingting-music-settings', JSON.stringify(settings));
    }
    
    // 加载主题设置
    loadThemeSetting() {
        const settings = JSON.parse(localStorage.getItem('tingting-music-settings') || '{}');
        if (settings.theme === 'light') {
            this.isDarkTheme = false;
            document.body.classList.add('light-theme');
            this.elements.themeToggleBtn.textContent = '☀️';
        } else {
            this.isDarkTheme = true;
            document.body.classList.remove('light-theme');
            this.elements.themeToggleBtn.textContent = '🌙';
        }
    }
    
    // 歌词相关方法
    async loadLyrics(trackId) {
        try {
            const response = await fetch(`/api/tracks/${trackId}/lyric`);
            if (response.ok) {
                const lyricData = await response.json();
                this.lyrics = this.parseLyrics(lyricData.content);
            } else {
                this.lyrics = [];
            }
        } catch (error) {
            console.error('加载歌词失败:', error);
            this.lyrics = [];
        }
    }
    
    async ensureLyricsRendered() {
        // 确保歌词渲染完成
        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    this.renderLyrics();
                    resolve();
                });
            });
        });
    }
    
    parseLyrics(lyricText) {
        const lines = lyricText.split('\n');
        const lyrics = [];
        
        const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;
        
        lines.forEach(line => {
            const matches = [...line.matchAll(timeRegex)];
            if (matches.length > 0) {
                const text = line.replace(timeRegex, '').trim();
                matches.forEach(match => {
                    const minutes = parseInt(match[1]);
                    const seconds = parseInt(match[2]);
                    const milliseconds = parseInt(match[3].padEnd(3, '0'));
                    const time = minutes * 60 + seconds + milliseconds / 1000;
                    
                    lyrics.push({ time, text });
                });
            }
        });
        
        // 按时间排序
        return lyrics.sort((a, b) => a.time - b.time);
    }
    
    renderLyrics() {
        if (this.lyrics.length === 0) {
            this.elements.lyrics.innerHTML = '<p>暂无歌词</p>';
            return;
        }
        
        // 强制清空歌词容器内容
        this.elements.lyrics.innerHTML = '';
        
        // 渲染歌词内容
        const html = this.lyrics.map((lyric, index) => {
            return `<div class="lyric-line" data-index="${index}">${lyric.text}</div>`;
        }).join('');
        
        // 延迟执行，确保DOM更新后再设置滚动位置
        requestAnimationFrame(() => {
            this.elements.lyrics.innerHTML = html;
            requestAnimationFrame(() => {
                // 强制设置滚动位置到顶部
                this.elements.lyrics.scrollTop = 0;
                // 清除所有current-line类
                document.querySelectorAll('.lyric-line').forEach(line => {
                    line.classList.remove('current-line');
                });
            });
        });
    }
    
    updateLyrics(isInitialLoad = false) {
        if (this.lyrics.length === 0) return;
        
        const currentTime = this.audio.currentTime;
        let currentIndex = -1;
        
        // 找到当前时间对应的歌词行
        for (let i = 0; i < this.lyrics.length; i++) {
            if (this.lyrics[i].time > currentTime) {
                currentIndex = i - 1;
                break;
            }
        }
        
        if (currentIndex === -1 && this.lyrics.length > 0) {
            currentIndex = this.lyrics.length - 1;
        }
        
        if (currentIndex !== this.currentLyricIndex) {
            // 移除所有current-line类
            document.querySelectorAll('.lyric-line').forEach(line => {
                line.classList.remove('current-line');
            });
            
            // 添加current-line类到当前歌词行
            const currentLine = document.querySelector(`.lyric-line[data-index="${currentIndex}"]`);
            if (currentLine) {
                currentLine.classList.add('current-line');
                
                // 仅在非初始化且用户没有手动滚动时才自动滚动
                if (!isInitialLoad) {
                    const lyricsContainer = this.elements.lyrics;
                    const isAtTop = lyricsContainer.scrollTop < 50;
                    const isNearCurrentLine = Math.abs(currentLine.offsetTop - lyricsContainer.scrollTop) < lyricsContainer.clientHeight;
                    
                    if (isAtTop || !isNearCurrentLine) {
                        // 延迟滚动，确保在DOM更新后再执行
                        setTimeout(() => {
                            currentLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 100);
                    }
                }
            }
            
            this.currentLyricIndex = currentIndex;
        }
    }
}

// 初始化播放器
document.addEventListener('DOMContentLoaded', () => {
    new MusicPlayer();
});
