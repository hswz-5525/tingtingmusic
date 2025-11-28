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
            selectFolderBtn: document.getElementById('select-folder-btn'),
            settingsBtn: document.getElementById('settings-btn'),
            closeSettingsBtn: document.getElementById('close-settings-btn'),
            settingsPanel: document.getElementById('settings-panel'),
            overlay: document.getElementById('overlay'),
            defaultPlayMode: document.getElementById('default-play-mode'),
            defaultVolume: document.getElementById('default-volume'),
            volumeValue: document.getElementById('volume-value'),
            progress: document.querySelector('.progress'),
            currentTime: document.getElementById('current-time'),
            totalTime: document.getElementById('total-time'),
            trackTitle: document.getElementById('track-title'),
            trackArtist: document.getElementById('track-artist'),
            volume: document.getElementById('volume'),
            tracksList: document.getElementById('tracks-list'),
            playlistsList: document.getElementById('playlists-list'),
            addPlaylistBtn: document.getElementById('add-playlist-btn'),
            currentListTitle: document.getElementById('current-list-title'),
            lyrics: document.getElementById('lyrics')
        };
        
        // 播放列表展开状态
        this.expandedPlaylists = new Set();
        
        // 加载设置
        this.loadSettings();
        
        this.init();
    }
    
    async init() {
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
    }
    
    async loadTracks() {
        try {
            const response = await fetch('/api/tracks');
            this.tracks = await response.json();
            this.renderTracks();
        } catch (error) {
            console.error('加载音乐列表失败:', error);
        }
    }
    
    async loadPlaylists() {
        try {
            const response = await fetch('/api/playlists');
            this.playlists = await response.json();
            this.renderPlaylists();
        } catch (error) {
            console.error('加载播放列表失败:', error);
        }
    }
    
    renderTracks() {
        this.elements.tracksList.innerHTML = '';
        
        this.tracks.forEach((track, index) => {
            const trackItem = document.createElement('div');
            trackItem.className = 'track-item';
            trackItem.dataset.index = index;
            
            const duration = this.formatTime(track.duration);
            
            // 获取文件名
            const fileName = track.file_path.split('/').pop().split('\\').pop();
            const fileNameWithoutExt = fileName.split('.').slice(0, -1).join('.');
            
            // 显示格式：歌曲名-歌手（文件名）
            const displayName = `${track.title} - ${track.artist ? track.artist.name : '未知艺术家'}`;
            const fullDisplayName = `${displayName} (${fileNameWithoutExt})`;
            
            trackItem.innerHTML = `
                <div class="track-number">${index + 1}</div>
                <div class="track-details">
                    <h3>${displayName}</h3>
                    <p class="file-name">${fileNameWithoutExt}</p>
                </div>
                <div class="track-duration">${duration}</div>
            `;
            
            trackItem.addEventListener('click', () => this.playTrack(index));
            this.elements.tracksList.appendChild(trackItem);
        });
    }
    
    renderPlaylists() {
        this.elements.playlistsList.innerHTML = '';
        
        // 添加"全部音乐"选项
        const allMusicItem = document.createElement('div');
        allMusicItem.className = 'playlist-item active';
        allMusicItem.dataset.id = 'all';
        allMusicItem.innerHTML = `
            <div class="playlist-name">全部音乐</div>
            <div class="playlist-actions">
                <button class="expand-btn" title="展开/收起">▼</button>
            </div>
        `;
        
        // 添加二级菜单容器
        const allMusicTracks = document.createElement('div');
        allMusicTracks.className = 'playlist-tracks';
        allMusicTracks.style.display = 'none';
        
        // 绑定点击事件
        allMusicItem.addEventListener('click', (e) => {
            if (!e.target.classList.contains('expand-btn')) {
                this.selectPlaylist('all');
            }
        });
        
        // 绑定展开/收起事件
        const allExpandBtn = allMusicItem.querySelector('.expand-btn');
        allExpandBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePlaylistTracks(allMusicTracks, allExpandBtn);
        });
        
        this.elements.playlistsList.appendChild(allMusicItem);
        this.elements.playlistsList.appendChild(allMusicTracks);
        
        // 分离默认播放列表和自定义播放列表
        const defaultPlaylists = this.playlists.filter(pl => pl.type !== 'custom');
        const customPlaylists = this.playlists.filter(pl => pl.type === 'custom');
        
        // 添加默认播放列表
        defaultPlaylists.forEach(playlist => {
            this.renderPlaylistItem(playlist);
        });
        
        // 添加自定义播放列表
        customPlaylists.forEach(playlist => {
            this.renderPlaylistItem(playlist);
        });
        
        // 渲染"全部音乐"的二级菜单
        this.renderPlaylistTracks('all', allMusicTracks);
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
                <button class="expand-btn" title="展开/收起">▼</button>
                ${actionsHtml}
            </div>
        `;
        
        // 添加二级菜单容器
        const tracksContainer = document.createElement('div');
        tracksContainer.className = 'playlist-tracks';
        tracksContainer.style.display = 'none';
        
        // 绑定点击事件
        playlistItem.addEventListener('click', (e) => {
            if (!e.target.classList.contains('expand-btn') && !e.target.classList.contains('delete-playlist-btn')) {
                this.selectPlaylist(playlist.id);
            }
        });
        
        // 绑定展开/收起事件
        const expandBtn = playlistItem.querySelector('.expand-btn');
        expandBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePlaylistTracks(tracksContainer, expandBtn);
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
        this.elements.playlistsList.appendChild(tracksContainer);
        
        // 渲染播放列表的二级菜单
        this.renderPlaylistTracks(playlist.id, tracksContainer);
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
            
            // 显示格式：歌曲名-歌手（文件名）
            const displayName = `${track.title} - ${track.artist ? track.artist.name : '未知艺术家'} (${fileNameWithoutExt})`;
            
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
        
        // 选择文件夹按钮
        this.elements.selectFolderBtn.addEventListener('click', () => this.selectMusicFolder());
        
        // 设置按钮
        this.elements.settingsBtn.addEventListener('click', () => this.openSettings());
        this.elements.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        this.elements.overlay.addEventListener('click', () => this.closeSettings());
        
        // 设置面板事件
        this.elements.defaultPlayMode.addEventListener('change', () => this.saveSettings());
        this.elements.defaultVolume.addEventListener('input', (e) => {
            this.elements.volumeValue.textContent = e.target.value + '%';
            this.saveSettings();
        });
        
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
    }
    
    // 设置功能
    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('tingting-music-settings') || '{}');
        
        // 应用设置
        if (settings.defaultPlayMode !== undefined) {
            this.playMode = settings.defaultPlayMode;
            this.elements.defaultPlayMode.value = settings.defaultPlayMode;
        }
        
        if (settings.defaultVolume !== undefined) {
            const volume = settings.defaultVolume / 100;
            this.audio.volume = volume;
            this.elements.volume.value = volume;
            this.elements.defaultVolume.value = settings.defaultVolume;
            this.elements.volumeValue.textContent = settings.defaultVolume + '%';
        }
        
        this.updatePlayModeIcon();
    }
    
    saveSettings() {
        const settings = {
            defaultPlayMode: parseInt(this.elements.defaultPlayMode.value),
            defaultVolume: parseInt(this.elements.defaultVolume.value)
        };
        localStorage.setItem('tingting-music-settings', JSON.stringify(settings));
    }
    
    openSettings() {
        this.elements.settingsPanel.classList.add('open');
        this.elements.overlay.classList.add('show');
    }
    
    closeSettings() {
        this.elements.settingsPanel.classList.remove('open');
        this.elements.overlay.classList.remove('show');
    }
    
    // 切换播放模式
    togglePlayMode() {
        this.playMode = (this.playMode + 1) % 4;
        this.updatePlayModeIcon();
    }
    
    // 更新播放模式图标
    updatePlayModeIcon() {
        this.elements.playModeIcon.textContent = this.playModeIcons[this.playMode];
    }
    
    // 选择音乐文件夹
    async selectMusicFolder() {
        // 这里只是一个示例，实际实现需要后端支持文件夹选择
        const folderPath = prompt('请输入音乐文件夹路径:');
        if (!folderPath || folderPath.trim() === '') return;
        
        try {
            // 调用API更新音乐文件夹
            const response = await fetch('/api/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ music_dir: folderPath.trim() })
            });
            
            if (response.ok) {
                alert('音乐文件夹已更新，正在重新扫描...');
                // 重新加载音乐列表
                await this.loadTracks();
            }
        } catch (error) {
            console.error('更新音乐文件夹失败:', error);
            alert('更新音乐文件夹失败');
        }
    }
    
    async playTrack(index) {
        if (index < 0 || index >= this.tracks.length) return;
        
        this.currentTrackIndex = index;
        const track = this.tracks[index];
        
        // 更新UI
        this.updateTrackInfo(track);
        this.updateActiveTrack();
        
        // 更新专辑封面
        this.updateAlbumCover(track.id);
        
        // 加载歌词
        await this.loadLyrics(track.id);
        
        // 设置音频源
        this.audio.src = `/api/tracks/${track.id}/stream`;
        this.audio.play();
        this.isPlaying = true;
        this.updatePlayButton();
    }
    
    togglePlay() {
        if (this.currentTrackIndex === -1 && this.tracks.length > 0) {
            // 首次播放，从第一首开始
            this.playTrack(0);
        } else if (this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
        } else {
            this.audio.play();
            this.isPlaying = true;
        }
        this.updatePlayButton();
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
        
        if (playlistId === 'all') {
            // 显示所有音乐
            this.currentPlaylist = null;
            this.elements.currentListTitle.textContent = '音乐列表';
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
    
    // 歌词相关方法
    async loadLyrics(trackId) {
        try {
            const response = await fetch(`/api/tracks/${trackId}/lyric`);
            if (response.ok) {
                const lyricData = await response.json();
                this.lyrics = this.parseLyrics(lyricData.content);
                this.renderLyrics();
            } else {
                this.lyrics = [];
                this.renderLyrics();
            }
        } catch (error) {
            console.error('加载歌词失败:', error);
            this.lyrics = [];
            this.renderLyrics();
        }
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
        
        const html = this.lyrics.map((lyric, index) => {
            return `<div class="lyric-line" data-index="${index}">${lyric.text}</div>`;
        }).join('');
        
        this.elements.lyrics.innerHTML = html;
    }
    
    updateLyrics() {
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
                // 滚动到当前歌词行
                currentLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            this.currentLyricIndex = currentIndex;
        }
    }
}

// 初始化播放器
document.addEventListener('DOMContentLoaded', () => {
    new MusicPlayer();
});
