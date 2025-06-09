# ~~XerxesDGreat.github.io~~ i-josh.com

This repository contains the source files for the [i-josh.com][i-josh] website.

## Info
The site uses the following little bits of technology
- Github-provided Jekyll static site generator functionality
- [Chirpy][chirpy] theme with some personal modifications
- [OpenSeadragon][openseadragon] for large image viewing

## How to run

### Ruby environment
> [!note]
> I'm not a Ruby developer, so there's likely much better ways to do this; I'm just
telling you what I did.

```bash
# chruby is a ruby environment manager; ruby-install makes it easy to install ruby (I guess?)
$ brew install chruby ruby-install

# actually install ruby; when I did this, it was v3.4.4
$ ruby-install ruby

# install some ruby gems we'll need to use
$ gem install bundler jekyll
```

### Website

```bash
# make the data available locally
$ git clone git@github.com:XerxesDGreat/XerxesDGreat.github.io.git

# run the application
$ cd XerxesDGreat.github.io
$ bundle install
$ bundle exec jekyll serve

# after a few moments (up to a minute, I've found), the site should be available
# at http://localhost:4000
```

## Adding content

### Posts

#### Where they go
All posts go into the `_posts` directory with the naming convention `YYYY-MM-DD-<postSlug>.md`. I don't know what happens if there are two posts with the same `postSlug`, but perhaps try to avoid it. I'm sure it wouldn't be a major issue; Jekyll will probably just do like Windows and add ` (1)` to the post name or something.

#### Frontmatter
Frontmatter should contain the following keys:

```yaml
---

# these keys are required
title: <Title which is displayed in the website>
date: <Should match the date on the file>
category: <Technically I think it supports multiple categories, but stick to one>
tags: 
- <a list>
- <of case-sensitive tags>

# optional
layout: <for a different layout than post; accepts `panorama` for now>
description: <uh... description>
toc: false <if you don't want a table of contents on the right>
slug: <if you want to override the default slugification>
---
```

### Images

Images go into a directory per post, based on the slug. For instance, if you have
an image called `mycar.jpg` in the post `2025-06-09-i-got-a-new-car.md`, you'd put
the image in the directory `assets/img/posts/i-got-a-new-car/mycar.jpg`. However,
this is a convention and doesn't provide any additional functionality as you still
have to use `![description](/assets/img/<slugName>/<imageFileName>)` to make the image appear.

A preview image for the post can be added to the frontmatter:
```yaml
---
image:
  path: /path/to/image
  alt: image alt text
---
```
Note that the image is expected to be 1200 x 630; it will be scaled and cropped if it isn't

## More Information

Check out the [theme's docs](https://github.com/cotes2020/jekyll-theme-chirpy/wiki).

[i-josh]: https://www.i-josh.com
[chirpy]: https://github.com/cotes2020/jekyll-theme-chirpy/
[openseadragon]: https://openseadragon.github.io/
