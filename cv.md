---
title: Curriculum Vitæ - Thomas Zuber
layout: page
---

<article class="cv">
  <header class="cv__header">
    <p class="muted">{{ site.data.cv.position }}</p>
    <p class="muted">{{ site.data.cv.location }}{% if site.data.cv.email %} · <a href="mailto:{{ site.data.cv.email }}">{{ site.data.cv.email }}</a>{% endif %}</p>
  </header>

  {% for s in site.data.cv.sections %}
    {% include cv-section.html title=s.title items=s.items %}
  {% endfor %}
</article>