"""Bundle only the public media files, with stable names and no workspace metadata."""
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

root = Path(__file__).resolve().parent.parent / 'assets' / 'press'
output = root / 'mugio-press-kit.zip'
current = [
    root / 'press-info.txt', root / 'moments-key-art.jpg',
    root / 'mugio-logo-lockup.png', root / 'mugio-logo-mark.png',
    root / 'moments-logo-en.svg', root / 'moments-logo-zh-20260907.png',
    root / 'moments-logo-ja-20260907.png',
]
files = sorted(current + list((root / 'artwork').glob('*')) + list((root / 'screenshots' / 'exhibition-20260907').glob('*.png')))
assert all(p.is_file() for p in files), 'Missing public media asset'
with ZipFile(output, 'w', compression=ZIP_DEFLATED, compresslevel=6) as archive:
    for path in files:
        archive.write(path, path.relative_to(root).as_posix())
with ZipFile(output) as archive:
    assert archive.testzip() is None, 'Press kit ZIP integrity check failed'
print(f'Packaged {len(files)} media files ({output.stat().st_size / 1024 / 1024:.1f} MB): {output.name}')
