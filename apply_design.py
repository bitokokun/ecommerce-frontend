"""Install/remove Souk's CSS-only design refresh without editing JS logic.
Usage: python apply_design.py "C:\\path\\to\\ecommerce-frontend"
Rollback: python apply_design.py "C:\\path\\to\\ecommerce-frontend" --remove
"""
from pathlib import Path
import argparse
import shutil


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('frontend', help='Path to the ecommerce-frontend repository root')
    parser.add_argument('--remove', action='store_true', help='Remove the optional visual upgrade')
    args = parser.parse_args()
    root = Path(args.frontend).expanduser().resolve()
    src = root / 'src'
    main_jsx = src / 'main.jsx'
    original_css = src / 'styles.css'
    premium_dest = src / 'premium.css'
    if not main_jsx.is_file() or not original_css.is_file():
        parser.error('Expected src/main.jsx and src/styles.css in the frontend folder')

    text = main_jsx.read_text(encoding='utf-8')
    import_line = 'import "./premium.css";'
    if args.remove:
        updated = text.replace(import_line + '\n', '').replace(import_line, '')
        main_jsx.write_text(updated, encoding='utf-8')
        if premium_dest.exists():
            premium_dest.unlink()
        print('Design layer removed; original CSS restored.')
        return

    source = Path(__file__).with_name('premium.css')
    if not source.exists():
        parser.error('premium.css must be beside this installer')
    if not (src / 'main.jsx.souk-backup').exists():
        shutil.copy2(main_jsx, src / 'main.jsx.souk-backup')
    shutil.copy2(source, premium_dest)
    if import_line not in text:
        base_css_import = 'import "./styles.css";'
        if base_css_import not in text:
            parser.error('Could not find the original styles.css import in main.jsx')
        text = text.replace(base_css_import, base_css_import + '\n' + import_line, 1)
        main_jsx.write_text(text, encoding='utf-8')
    print(f'Design installed at: {premium_dest}')
    print('Run npm install (if needed) and npm run dev in the frontend folder.')


if __name__ == '__main__':
    main()
