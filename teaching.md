---
title: Enseignement
---

{% for c in site.courses %}
- [{{ c.title }}]({{ c.url }}) — {{ c.level }} · {{ c.institution }}
{% endfor %}