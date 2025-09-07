---
title: Recherche
---

<div class="grid ">
  {% for pr in site.projects %}
    {% include project-card.html project=pr %}
  {% endfor %}
</div>