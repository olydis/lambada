---
layout: page
title: Implementation
header: LambAda Implementation
tagline: of minimal LambAda runtimes (including computation ability)
group: navigation
published: true
---

## Haskell
{% highlight haskell %}

-- Abstract Syntax
data Expression = App Expression Expression | U
instance Show Expression where
  show (App f a)   = "(" ++ show f ++ " " ++ show a ++ ")"
  show U           = "u"

-- Semantics
valueOf :: Expression -> Expression
valueOf x = maybe x valueOf $ reduce x

reduce :: Expression -> Maybe Expression
reduce (App U (App U (App U U)))                                 = Nothing
reduce (App (App (App U (App U (App U U))) a) b)                 = Just $ a
reduce (App U (App U (App U (App U U))))                         = Nothing
reduce (App (App (App (App U (App U (App U (App U U)))) a) b) c) = Just $ App (App a c) (App b c)
reduce (App U a)                                                 = Just $ App (App a (App U (App U (App U (App U U))))) (App U (App U (App U U)))
reduce (App f a)                                                 = fmap (\f' -> App f' a) (reduce f)
reduce _                                                         = Nothing

{% endhighlight %}


<ul class="posts">
  {% for post in site.posts %}
    <li><span>{{ post.date | date_to_string }}</span> &raquo; <a href="{{ BASE_PATH }}{{ post.url }}">{{ post.title }}</a></li>
  {% endfor %}
</ul>