# Gistizer

An [Cloudflare Workers](https://www.cloudflare.com/ja-jp/developer-platform/products/workers/) app to embed files from a GitHub repository like a GitHub Gist inspired by [gist-it](https://github.com/robertkrimen/gist-it).

## Usage

```html
<script defer src="https://gistizer.super-hall-effd.workers.dev/github/$user/$repository/blob/$branch/$path"></script>
```

### options

|param|example|explanation|
|---|---|---|
| `slice` | `slice=:-2` | Show the first line up to and including the second to last line |
| | `slice=24:100` | Show lines 24 through 100 |
| | `slice=1` | Show only the first line of the file |
| `footer` | `footer=no`, `footer=0` | Hide the footer |
| | `footer=minimal` | Show the footer without "This Gist brought to you by gistizer." |
| `highlight` | `highlight=no`, `highlight=0` | Disable the highlight |
| `lang` | `lang=html` | Loads the language handler of the [code-prettify](https://github.com/googlearchive/code-prettify). See the [index of language handlers](https://github.com/googlearchive/code-prettify/blob/master/src).  |
| `skin` | `skin=default` | See the [skin gallery](https://raw.githack.com/google/code-prettify/master/styles/index.html) of the [code-prettify](https://github.com/googlearchive/code-prettify). Behaviour when different skins are used on the same page is undefined. (default: `sons-of-obsidian`) |
| `fetchfrom` | `fetchfrom=github`, `fetchfrom=jsdelivr` | CDN from which source code is obtained (default: `jsdelivr`) |

### example

```html
<script defer src="https://gistizer.super-hall-effd.workers.dev/github/advanceboy/gistizer/blob/main/README.md?slice=1:&footer=minimal&skin=default"></script>
```
