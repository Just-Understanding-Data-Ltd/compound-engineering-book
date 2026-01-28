-- Pandoc Lua filter: strip .md cross-reference links
-- Converts [Chapter Title](chXX-filename.md) to plain text "Chapter Title"
-- This prevents RSC-007 errors in EPUB validation

function Link(el)
  if el.target:match("%.md$") then
    return el.content
  end
  return el
end
