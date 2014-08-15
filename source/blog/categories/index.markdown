---
layout: page
title: "Categories"
date: 2013-07-28 23:11
comments: false
sharing: false
footer: false
description: The categories of Mitja Bezenšek's blog.
keywords: Mitja Bezenšek, blog, categories
---
<ul>
{% for item in site.categories %}
    <li><a href="/blog/categories/{{ item[0] | replace:" ","-" }}/">{{ item[0] | capitalize }}</a> ({{ item[1].size }})</li>
{% endfor %}
</ul>
