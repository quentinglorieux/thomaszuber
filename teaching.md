---
title: Enseignement
---

{% for c in site.courses %}
- [{{ c.title }}]({{ site.baseurl }}{{ c.url }}) — {{ c.level }} · {{ c.institution }}
{% endfor %}