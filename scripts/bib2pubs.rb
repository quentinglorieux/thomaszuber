#!/usr/bin/env ruby
# frozen_string_literal: true

require 'yaml'
require 'fileutils'
require 'bibtex'

ROOT = File.expand_path('..', __dir__)
CONFIG = YAML.load_file(File.join(ROOT, '_config.yml'))
SOURCE_MODE = (CONFIG['publications_source'] || 'collection').to_s

BIB_PATH   = File.join(ROOT, '_data', 'publications.bib')
OUT_DIR    = File.join(ROOT, '_publications')

def slugify(str)
  str.downcase
     .gsub(/['`]/, '')
     .gsub(/[^a-z0-9]+/, '-')
     .gsub(/^-+|-+$/, '')
end

def authors_to_list(names)
  # BibTeX::Names -> [ "First Last", ... ]
  names.map { |n| [n.first, n.last].compact.join(' ').strip }
end

if SOURCE_MODE != 'bibtex'
  puts "[bib2pubs] publications_source != 'bibtex' (#{SOURCE_MODE}) — rien à faire."
  exit 0
end

unless File.exist?(BIB_PATH)
  warn "[bib2pubs] Fichier introuvable: #{BIB_PATH}"
  exit 0
end

FileUtils.mkdir_p(OUT_DIR)

bib = BibTeX.open(BIB_PATH)
count = 0

bib.each do |entry|
  next unless entry.respond_to?(:type) && entry[:title]
  title = entry[:title].to_s.strip
  year_str = entry[:year].to_s.strip
  year = year_str.empty? ? nil : year_str

    # bibtex-ruby: c'est `entry.key` (pas `key?`)
  key =
    if entry.respond_to?(:key) && entry.key && !entry.key.to_s.strip.empty?
        entry.key.to_s
    else
        slugify(title)[0..40]
    end

  slug = year ? "#{year}-#{slugify(title)}" : slugify(title)
  fname = File.join(OUT_DIR, "#{slug}.md")

  authors =
  if entry[:author].respond_to?(:names)
    authors_to_list(entry[:author].names)
  elsif entry[:author]
    entry[:author].to_s.split(/\s+and\s+/i).map(&:strip)
  else
    []
  end

  venue = (entry[:journal] || entry[:booktitle]).to_s.strip
  pdf   = entry[:pdf].to_s.strip
  url   = (entry[:url] || (entry[:doi] ? "https://doi.org/#{entry[:doi]}" : nil)).to_s.strip
  tags  = entry[:keywords].to_s.split(/[,;]\s*/).reject(&:empty?)
  abstract = entry[:abstract].to_s.strip

  front = {
    'layout'        => 'publication',
    'title'         => title,
    'authors'       => authors,
    'venue'         => venue.empty? ? nil : venue,
    'year'          => year.empty? ? nil : year.to_i,
    'pdf_url'       => pdf.empty? ? nil : pdf,
    'publisher_url' => url.empty? ? nil : url,
    'abstract'      => abstract.empty? ? nil : abstract,
    'tags'          => tags.empty? ? nil : tags
  }.compact

  body = +"---\n"
  body << front.to_yaml
  body << "---\n\n"
  body << "*Imported from BibTeX key:* `#{key}`\n"

  File.write(fname, body)
  count += 1
end

puts "[bib2pubs] Généré #{count} fichier(s) dans #{OUT_DIR}"