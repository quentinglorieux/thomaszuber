---
title: Publications
layout: page
---

{% assign years = site.publications | map:'year' | uniq | sort | reverse %}
{% for y in years %}
### {{ y }}
<div class="stack">
  {% for p in site.publications | where:'year', y %}
    {% include pub-card.html pub=p %}
  {% endfor %}
</div>
{% endfor %}