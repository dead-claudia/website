The files for the blog.

Note that the posts should be under posts/ and have the following header above
each one:

```yaml
# Obviously, each of these depend on the post
title: Some pretty blog post title
date: 2016-1-1
tags: [tag, tag, tag]
---
My beautiful blog post body...
```

In the JSON, it'll have this kind of structure. And note that the preview is
capped to 200 words, rounded down to the nearest word.

```json
{
    "posts": [
        {
            "date": "2016-01-01T05:00:00.000Z",
            "title": "Some pretty blog post title",
            "preview": "My beautiful blog post body...",
            "url": "/blog/posts/blog-post.md",
            "tags": ["post", "pretty", "etc"]
        }
    ]
}
```

Here's a schema for that JSON:

```json
{
    "$schema": "http://json-schema.org/schema#",
    "id": "/blog.json",
    "type": "object",
    "required": true,

    "definitions": {
        "post": {
            "description": "Represents a single post.",
            "type": "object",
            "properties": {
                "date": {"type": "string"},
                "title": {"type": "string"},
                "preview": {"type": "string"},
                "url": {"type": "string"},
                "tags": {
                    "type": "array",
                    "additionalItems": {"type": "string"}
                }
            }
        }
    },

    "properties": {
        "posts": {
            "type": "array",
            "additionalItems": {"$ref": "#/definitions/post"}
        }
    }
}
```
