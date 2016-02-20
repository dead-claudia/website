The files for my blog.

## Notes:

1. In my blog, I added a syntactic extension to it for resizing images:

    ```md
    <!-- Markdown -->
    ![alt](href = x 200 "title")
    ![alt](href = 300 x "title")
    ![alt](href = 300 x 200 "title")
    ```

    This Markdown compiles to the following HTML:

    ```html
    <!-- HTML -->
    <img href="href" alt="alt" title="title" width="200">
    <img href="href" alt="alt" title="title" height="300">
    <img href="href" alt="alt" title="title" height="300" width="200">
    ```

    This may accept a percentage or a pixel value. Both must be numeric. Also,
    the whitespace is purely optional after the equals sign. The above Markdown
    is equivalent to the following more minimal Markdown below:

    ```md
    <!-- Markdown -->
    ![alt](href =x200 "title")
    ![alt](href =300x "title")
    ![alt](href =300x200 "title")
    ```

2. The posts should be under posts/ and have the following header above
    each one:

    ```yaml
    ---
    # Obviously, each of these depend on the post
    title: Some pretty blog post title
    date: 2016-1-1
    tags: [tag, tag, tag]
    ---
    My beautiful blog post body...
    ```

    Assuming this is the only post, "blog.json" will look like this:

    ```json
    {
        "posts": [
            {
                "date": "2016-01-01T05:00:00.000Z",
                "title": "Some pretty blog post title",
                "preview": "My beautiful blog post body...",
                "url": "blog-post.md",
                "tags": ["post", "pretty", "etc"]
            }
        ]
    }
    ```

    Note that the preview is capped to 200 words, rounded down to the nearest
    word.

    Here's a TypeScript interface for blog.json, if that helps explain it:

    ```ts
    // The wrapper object of blog.json, to prevent remote execution.
    interface Listing {
        posts: Array<Post>;
    }

    interface Post {
        // The date, in simplified extended ISO 8601 format
        date: string;

        // The title of the post
        title: string;

        // A 200-character preview, rounded down to the nearest word
        preview: string;

        // The URL of the post
        url: string;

        // The tags for this post
        tags: Array<string>;
    }
    ```
