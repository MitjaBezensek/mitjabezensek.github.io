---
layout: post
title: "How to use Add This with Octopress to add social buttons"
date: 2014-07-23 18:04:44 +0200
comments: true
description: Octopress is a great blogging framework with easy customizations. In this post I'll take you through adding some social buttons at the bottom of your posts.
keywords: octopress, blog, social
categories: [octopress, blog, social]
---

[Octopress][1] is a great blogging framework for (mostly) technical people that like to have everything under control. It's great to:

 - have your whole blog in version control,
 - use [github pages][2] for hosting since it's basically just a bunch of static pages,
 - style your blog with the help of many free themes,
 - easily customize and extend your blog by plugging in different pieces of functionality.

Today I'm gonna show you how easy it is to add social share buttons below each of your posts. Let's get started.

 
<!-- more -->

Octopress by default supports the [Add this][4] social buttons. But it was a bit too limiting to my taste, so I removed all of it and started from scratch.

The first thing to do is to create the account at Add This. This will allow you to customize your social buttons just the way you want them. I went for the "Original sharing buttons" and have set them like this:

{% img /img/OriginalSharingButtons.png 'Add this social buttons' 'Add this social buttons' %}

Below the services selection window you will see the code that you should copy and paste to your blog. But where should you put it? I decided to put the social buttons below each blog post, similar to what Octopress offers by default. So I needed to find the post template which is under `source/_layouts/post.html`. In it we can see that the social share buttons are already rendering beneath the article template:

{% raw %}
``` ruby
    <article class="post" itemscope itemtype="http://schema.org/BlogPosting">
    	{% include article.html %}
    </article>
    {% unless page.sharing == false %}
    	{% include post/sharing.html %}
    {% endunless %}
```
{% endraw %}

If you wanted you could have easily displayed the buttons even above the article just by copying the {% raw %} `{% include post/sharing.html %}` {% endraw %}on the top of the template. I even went and removed the unless statement, since I know I want to show the social buttons. 

Because the sharing template is already rendering we just need to post our code from Add this to `sharing.html` which is under `source/_includes/posts/sharing.html`:
``` javascript
<script type="text/javascript" 
	src="//s7.addthis.com/js/300/addthis_widget.js#pubid=yourPubId">
</script>
<div class="addthis_native_toolbox"></div>
```

If we now generate the files again we should see the social buttons we selected beneath every blog post. Another nice thing about this is that if we wish to change how our buttons looks of if decide we wish to add some other buttons we only need to update our template at the Add this webpage and our buttons will update all across our site!

  [1]: http://octopress.org/
  [2]: https://pages.github.com/
  [3]: https://github.com/shashankmehta/greyshade
  [4]: http://www.addthis.com/