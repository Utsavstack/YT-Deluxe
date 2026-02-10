from yt_dlp import YoutubeDL

def check_thumbnail():
    ydl_opts = {
        'quiet': True,
        'skip_download': True,
    }
    
    with YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info('https://www.youtube.com/watch?v=dQw4w9WgXcQ', download=False)
        
    print('Thumbnail:', info.get('thumbnail'))
    print('\nThumbnails list:')
    if info.get('thumbnails'):
        for i, thumb in enumerate(info.get('thumbnails')):
            print(f"Thumbnail {i}:")
            print(f"  URL: {thumb.get('url')}")
            print(f"  Resolution: {thumb.get('width')}x{thumb.get('height')}")
    else:
        print('No thumbnails found')

if __name__ == '__main__':
    check_thumbnail()