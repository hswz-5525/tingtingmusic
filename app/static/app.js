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
            lyricsSection: document.querySelector('.lyrics-section'),
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
        
        // 记录歌词区域滚动位置
        this.lastScrollPosition = 0;
        
        // 记录用户是否正在滚动
        this.isUserScrolling = false;
        
        // 记录滚动停止的计时器
        this.scrollStopTimer = null;
        
        // 分离界面浏览状态和歌词滚动状态
        // isBrowsing: 用于界面浏览控制（如歌曲列表点击后的状态）
        // isLyricsScrollEnabled: 用于控制歌词自动滚动
        this.isBrowsing = false;
        this.isLyricsScrollEnabled = true;
        
        // 添加歌词滚动状态切换方法
        this.toggleLyricsScroll = () => {
            this.isLyricsScrollEnabled = !this.isLyricsScrollEnabled;
            console.log('歌词自动滚动已', this.isLyricsScrollEnabled ? '启用' : '禁用');
            
            // 更新UI提示（如果需要的话）
            if (this.elements.lyrics) {
                this.elements.lyrics.style.opacity = this.isLyricsScrollEnabled ? '1' : '0.7';
            }
        };
        
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
        
        // 初始化歌词滚动监听
        this.initScrollListener();
        
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
            trackItem.addEventListener('click', () => {
                // 标记开始浏览状态
                this.isBrowsing = true;
                this.playTrack(index);
                // 不自动清除浏览状态，由用户主动操作或页面切换来清除
            });
            
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
            trackItem.addEventListener('click', () => {
                // 标记开始浏览状态
                this.isBrowsing = true;
                this.playTrack(index);
                // 延迟清除浏览状态，给用户足够时间浏览
                setTimeout(() => {
                    this.isBrowsing = false;
                }, 3000);
            });
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
        
        // 进度条点击和触摸支持
        // 使用箭头函数确保this指向正确
        this.elements.progress.addEventListener('click', (e) => {
            console.log('click事件触发');
            this.seek(e);
        });
        
        // 添加触摸事件支持，适配手机端
        this.elements.progress.addEventListener('touchstart', (e) => {
            console.log('touchstart事件触发');
            this.seek(e);
        });
        
        // 添加触摸移动事件支持，允许在进度条上滑动
        this.elements.progress.addEventListener('touchmove', (e) => {
            console.log('touchmove事件触发');
            this.seek(e);
        });
        
        // 添加触摸结束事件支持
        this.elements.progress.addEventListener('touchend', (e) => {
            // 阻止默认行为
            e.preventDefault();
        });
        
        // 音量控制 - 添加input和change事件支持，确保手机端能正常滑动
        this.elements.volume.addEventListener('input', (e) => {
            this.audio.volume = e.target.value;
        });
        
        // 添加change事件，确保在某些浏览器中能正常工作
        this.elements.volume.addEventListener('change', (e) => {
            this.audio.volume = e.target.value;
        });
        
        // 添加触摸事件支持，确保在所有手机浏览器中都能正常工作
        this.elements.volume.addEventListener('touchstart', (e) => {
            // 阻止默认行为，确保滑块能正常响应
            e.preventDefault();
        });
        
        this.elements.volume.addEventListener('touchmove', (e) => {
            // 阻止默认行为，确保滑块能正常响应
            e.preventDefault();
        });
        
        this.elements.volume.addEventListener('touchend', (e) => {
            // 阻止默认行为，确保滑块能正常响应
            e.preventDefault();
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
    
    async playTrack(index, keepPosition = false) {
        if (index < 0 || index >= this.tracks.length) return;

        this.currentTrackIndex = index;
        const track = this.tracks[index];

        // 保存当前播放位置（如果要求保持）
        const savedTime = keepPosition ? this.audio.currentTime : 0;

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

        // 设置音频源 - 注意：这可能会触发音频重新加载
        this.audio.src = `/api/tracks/${track.id}/stream`;
        
        // 恢复播放位置（如果要求保持）
        if (keepPosition && savedTime > 0) {
            this.audio.addEventListener('loadedmetadata', () => {
                // 延迟恢复位置，确保音频完全加载
                setTimeout(() => {
                    this.audio.currentTime = savedTime;
                    console.log(`🔄 恢复播放位置: ${savedTime.toFixed(2)}秒`);
                }, 100);
            }, { once: true });
        }
        
        try {
            // 预加载歌词（同步操作）
            await this.loadLyrics(track.id);
            
            // 确保歌词已渲染完成（同步操作）
            await this.ensureLyricsRendered();
            
            // 立即初始化歌词状态，防止任何意外的滚动
            if (this.lyrics && this.lyrics.length > 0) {
                this.currentLyricIndex = -1;
                
                // 立即重置歌词滚动位置到顶部
                if (this.elements.lyrics) {
                    this.elements.lyrics.scrollTop = 0;
                }
                
                // 强制重置歌词显示状态，清除可能存在的样式类
                const allLyricLines = document.querySelectorAll('.lyric-line');
                allLyricLines.forEach(line => {
                    line.classList.remove('current-line', 'current');
                });
                
                // 立即更新歌词状态到第0行，但不要滚动
                this.updateLyricsOnTrackChange();
            }
            
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
        
        // 延迟清除浏览状态，让用户有时间浏览列表，但不阻止歌词滚动
        setTimeout(() => {
            this.isBrowsing = false;
        }, 1000); // 1秒后清除浏览状态
    }
    
    // 专门处理歌曲切换时的歌词初始化，确保当前歌词行显示在视窗内
    updateLyricsOnTrackChange() {
        if (!this.lyrics || this.lyrics.length === 0) return;

        // 找到当前时间应该显示的歌词行
        const currentTime = this.audio.currentTime;
        let targetIndex = -1;

        // 找到当前时间对应的歌词行
        for (let i = 0; i < this.lyrics.length; i++) {
            if (this.lyrics[i].time > currentTime) {
                targetIndex = i - 1;
                break;
            }
        }

        if (targetIndex === -1 && this.lyrics.length > 0) {
            targetIndex = this.lyrics.length - 1;
        }

        // 设置目标歌词行为当前行
        const targetLine = document.querySelector(`.lyric-line[data-index="${targetIndex}"]`);
        if (targetLine) {
            // 清除所有歌词行的当前状态
            const allLyricLines = document.querySelectorAll('.lyric-line');
            allLyricLines.forEach(line => {
                line.classList.remove('current-line', 'current');
            });

            // 设置目标歌词行为当前行
            targetLine.classList.add('current-line');
            targetLine.classList.add('current');

            // 触发滚动，让当前歌词行显示在视窗内，修正滑动条初始位置
            if (this.isLyricsScrollEnabled && !this.isUserScrolling) {
                // 统一使用lyrics-section作为滚动容器，与电脑端保持完全相同的逻辑
                const lyricsContainer = this.elements.lyricsSection;
                if (lyricsContainer) {
                    // 使用更兼容的滚动计算方法，避免getBoundingClientRect()在手机端的兼容性问题
                    // 通过当前歌词行索引直接计算滚动位置
                    const lyricLines = document.querySelectorAll('.lyric-line');
                    if (lyricLines.length === 0) return;

                    // 计算目标行之前的总高度
                    let heightBeforeTargetLine = 0;
                    for (let i = 0; i < targetIndex; i++) {
                        if (lyricLines[i]) {
                            heightBeforeTargetLine += lyricLines[i].offsetHeight;
                        }
                    }

                    // 获取目标行高度
                    const lineHeight = targetLine.offsetHeight;

                    // 获取容器高度
                    const containerHeight = lyricsContainer.clientHeight;

                    // 计算目标滚动位置：使当前行在容器中居中
                    const scrollTarget = heightBeforeTargetLine + lineHeight / 2 - containerHeight / 2;

                    // 确保scrollTarget在有效范围内
                    const maxScroll = Math.max(0, lyricsContainer.scrollHeight - containerHeight);
                    const finalScrollTarget = Math.max(0, Math.min(scrollTarget, maxScroll));

                    // 强制滚动到目标位置，确保当前歌词行显示在视窗内
                    lyricsContainer.scrollTop = finalScrollTarget;

                    // 保存当前滚动位置
                    this.lastScrollPosition = lyricsContainer.scrollTop;
                }
            }
        }

        // 更新内部索引
        this.currentLyricIndex = targetIndex;
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
        // 阻止默认行为，防止页面滚动
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🔍 seek方法被触发');
        
        // 确保this指向正确
        if (!this.audio) {
            console.error('this.audio未定义');
            return;
        }
        
        const progressElement = this.elements.progress;
        if (!progressElement) {
            console.error('progressElement未定义');
            return;
        }
        
        const rect = progressElement.getBoundingClientRect();
        let clickX;
        
        // 处理不同类型的事件，统一使用getBoundingClientRect()计算
        if (e.type === 'click') {
            // 鼠标点击事件
            clickX = e.clientX - rect.left;
            console.log(`🖱️ 点击事件: clientX=${e.clientX}, rect.left=${rect.left}, clickX=${clickX}`);
        } else if (e.type === 'touchstart' || e.type === 'touchmove') {
            // 触摸事件
            const touch = e.touches[0];
            clickX = touch.clientX - rect.left;
            console.log(`👆 触摸事件: clientX=${touch.clientX}, rect.left=${rect.left}, clickX=${clickX}`);
        } else {
            // 其他情况
            clickX = e.clientX - rect.left;
            console.log(`❓ 其他事件: clientX=${e.clientX}, rect.left=${rect.left}, clickX=${clickX}`);
        }
        
        const progressWidth = rect.width;
        // 确保clickX在有效范围内
        clickX = Math.max(0, Math.min(clickX, progressWidth));
        
        const duration = this.audio.duration;
        console.log(`📊 进度条信息: 宽度=${progressWidth}, 歌曲时长=${duration}秒`);
        
        if (duration && duration > 0 && progressWidth > 0) {
            // 计算新的播放时间 - 使用最简单的逻辑
            const percent = clickX / progressWidth;
            const newTime = duration * percent;
            
            console.log(`🎯 定位计算: 点击比例=${percent.toFixed(3)}, 目标时间=${newTime.toFixed(2)}秒`);
            
            // 保存目标时间，用于重试
            const savedTargetTime = newTime;
            
            // 尝试设置播放时间
            const attemptSeek = () => {
                try {
                    this.audio.currentTime = savedTargetTime;
                    const actualTime = this.audio.currentTime;
                    console.log(`✅ 设置播放时间: 目标=${savedTargetTime.toFixed(2)}秒, 实际=${actualTime.toFixed(2)}秒`);
                    
                    // 检查是否设置成功
                    if (Math.abs(actualTime - savedTargetTime) < 0.1) {
                        console.log('🎯 定位成功！');
                        
                        // 确保播放状态与UI同步
                        if (this.isPlaying && this.audio.paused) {
                            console.log('▶️ 恢复播放');
                            this.audio.play().catch(error => {
                                console.error('❌ 播放失败:', error);
                            });
                        }
                    } else {
                        console.log(`⚠️ 定位偏差较大，可能需要重试`);
                        // 延迟重试一次
                        setTimeout(() => {
                            if (this.audio.currentTime < 0.1) {
                                console.log('🔄 重试定位...');
                                this.audio.currentTime = savedTargetTime;
                            }
                        }, 100);
                    }
                } catch (error) {
                    console.error('❌ 设置播放时间失败:', error);
                }
            };
            
            // 立即尝试定位
            attemptSeek();
            
            // 监听loadedmetadata事件，如果音频重新加载，重新定位
            const onLoadedMetadata = () => {
                console.log('📡 检测到loadedmetadata事件，重新定位...');
                setTimeout(() => {
                    if (this.audio.currentTime < 0.1) {
                        console.log(`🔄 音频加载完成，重新定位到${savedTargetTime.toFixed(2)}秒`);
                        this.audio.currentTime = savedTargetTime;
                    }
                }, 50);
            };
            
            // 添加一次性事件监听器
            this.audio.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
            
            // 延迟清理事件监听器（防止内存泄漏）
            setTimeout(() => {
                this.audio.removeEventListener('loadedmetadata', onLoadedMetadata);
            }, 1000);
            
        } else {
            console.log(`❌ 无法定位: duration=${duration}, progressWidth=${progressWidth}`);
        }
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
        if (this.isPlaying) {
            this.elements.playBtn.innerHTML = '⏸️';
        } else {
            this.elements.playBtn.innerHTML = '▶️';
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
            // 默认歌词文本
            let lyricsText = '[00:00.00]暂无歌词';
            
            // 尝试获取歌词
            const response = await fetch(`/api/tracks/${trackId}/lyric`);
            if (response.ok) {
                const lyricData = await response.json();
                if (lyricData && lyricData.content) {
                    lyricsText = lyricData.content;
                }
            }
            
            // 解析歌词文本
            this.lyrics = this.parseLyrics(lyricsText);
        } catch (error) {
            console.error('加载歌词失败:', error);
            // 即使获取失败，也添加默认歌词
            this.lyrics = [{ time: 0, text: '暂无歌词' }];
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
        // 优化渲染逻辑，减少闪烁
        if (!this.elements.lyrics) return;
        
        const html = this.lyrics.length === 0 
            ? '<div class="lyric-line" data-index="0">暂无歌词</div>'
            : this.lyrics.map((lyric, index) => {
                return `<div class="lyric-line" data-index="${index}">${lyric.text}</div>`;
            }).join('');
        
        // 一次性更新HTML，避免频繁DOM操作
        this.elements.lyrics.innerHTML = html;
        
        // 确保歌词内容更新后立即重置滚动位置和清除样式
        this.elements.lyrics.scrollTop = 0;
        this.currentLyricIndex = -1; // 重置当前歌词索引
        
        // 清除所有歌词行的高亮
        document.querySelectorAll('.lyric-line').forEach(line => {
            line.classList.remove('current-line', 'current');
        });
        
        // 保存当前歌词HTML，用于后续比较
        this.lastLyricsHtml = this.elements.lyrics.innerHTML;
        
        // 歌词渲染完成后，立即更新歌词显示，确保当前行在视图中
        requestAnimationFrame(() => {
            this.updateLyrics(true);
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

        // 确保索引在有效范围内
        currentIndex = Math.max(0, Math.min(currentIndex, this.lyrics.length - 1));

        // 获取当前歌词行元素
        const currentLine = document.querySelector(`.lyric-line[data-index="${currentIndex}"]`);
        if (!currentLine) return;

        // 清除所有歌词行的高亮，确保只有当前行被高亮
        document.querySelectorAll('.lyric-line').forEach(line => {
            line.classList.remove('current-line', 'current');
        });

        // 添加高亮类
        currentLine.classList.add('current-line');
        currentLine.classList.add('current');

        // 仅在歌词滚动启用且用户没有手动滚动时才自动滚动
        if (this.isLyricsScrollEnabled && !this.isUserScrolling) {
            // 重新获取元素，确保DOM已经更新
            const updatedCurrentLine = document.querySelector(`.lyric-line[data-index="${currentIndex}"]`);
            if (!updatedCurrentLine) return;

            // 统一使用lyrics-section作为滚动容器，与电脑端保持完全相同的逻辑
            const lyricsContainer = this.elements.lyricsSection;
            if (!lyricsContainer) return;

            // 使用更兼容的滚动计算方法，避免getBoundingClientRect()在手机端的兼容性问题
            // 方法1：通过当前歌词行索引直接计算滚动位置
            const allLyricLines = document.querySelectorAll('.lyric-line');
            if (allLyricLines.length === 0) return;

            // 计算当前行之前的总高度
            let heightBeforeCurrentLine = 0;
            for (let i = 0; i < currentIndex; i++) {
                if (allLyricLines[i]) {
                    heightBeforeCurrentLine += allLyricLines[i].offsetHeight;
                }
            }

            // 获取当前行高度
            const lineHeight = updatedCurrentLine.offsetHeight;

            // 获取容器高度
            const containerHeight = lyricsContainer.clientHeight;

            // 计算目标滚动位置：使当前行在容器中居中
            const scrollTarget = heightBeforeCurrentLine + lineHeight / 2 - containerHeight / 2;

            // 确保scrollTarget在有效范围内
            const maxScroll = Math.max(0, lyricsContainer.scrollHeight - containerHeight);
            const finalScrollTarget = Math.max(0, Math.min(scrollTarget, maxScroll));

            // 强制滚动到目标位置，确保当前歌词行显示在视窗内
            lyricsContainer.scrollTop = finalScrollTarget;

            // 保存当前滚动位置
            this.lastScrollPosition = lyricsContainer.scrollTop;
        }

        // 更新当前歌词索引
        this.currentLyricIndex = currentIndex;
    }
    
    // 记录歌词区域滚动位置
    initScrollListener() {
        // 为所有可能的歌词容器添加滚动监听
        const scrollContainers = [];
        if (this.elements.lyricsSection) scrollContainers.push(this.elements.lyricsSection);
        if (this.elements.lyrics) scrollContainers.push(this.elements.lyrics);
        
        if (scrollContainers.length === 0) return;
        
        // 滚动事件处理函数
        const handleScroll = (container) => {
            return () => {
                // 更新滚动位置
                this.lastScrollPosition = container.scrollTop;
                
                // 记录用户滚动状态
                this.isUserScrolling = true;
                
                // 清除之前的计时器
                if (this.scrollStopTimer) {
                    clearTimeout(this.scrollStopTimer);
                }
                
                // 设置一个计时器，在滚动停止后1.5秒重置滚动状态
                this.scrollStopTimer = setTimeout(() => {
                    this.isUserScrolling = false;
                }, 1500);
            };
        };
        
        // 点击事件处理函数
        const handleClick = () => {
            // 清除浏览状态，允许歌词自动滚动
            this.isBrowsing = false;
        };
        
        // 为每个滚动容器添加事件监听
        scrollContainers.forEach(container => {
            // 使用被动事件监听器，提高滚动性能
            container.addEventListener('scroll', handleScroll(container), { passive: true });
            
            // 添加歌词区域点击监听器，清除浏览状态
            container.addEventListener('click', handleClick);
            
            // 初始化滚动位置
            this.lastScrollPosition = container.scrollTop;
        });
        
        // 初始化滚动状态
        this.isUserScrolling = false;
    }
}

// 初始化播放器
document.addEventListener('DOMContentLoaded', () => {
    new MusicPlayer();
});
