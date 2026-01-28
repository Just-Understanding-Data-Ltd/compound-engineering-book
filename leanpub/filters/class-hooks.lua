-- Pandoc Lua filter: add CSS class hooks for EPUB styling
-- Adds .part-header to part divider headings
-- Adds .chapter-opener to chapter h1 headings
-- Adds .callout to blockquotes with Tip/Note/Warning markers

function Header(el)
  if el.level == 1 then
    local text = pandoc.utils.stringify(el)
    if text:match("^Part ") then
      -- Part divider heading: add part-header class
      el.classes:insert("part-header")
    else
      -- Chapter or section h1: add chapter-opener class
      el.classes:insert("chapter-opener")
    end
    return el
  end
end

function BlockQuote(el)
  -- Check if blockquote starts with bold text containing Tip/Note/Warning
  if #el.content > 0 then
    local first = el.content[1]
    if first.t == "Para" and #first.content > 0 then
      local firstInline = first.content[1]
      if firstInline.t == "Strong" then
        local strongText = pandoc.utils.stringify(firstInline)
        if strongText:match("^Tip") or strongText:match("^Note") or strongText:match("^Warning") then
          -- Wrap blockquote content in a Div with .callout class
          local calloutType = "info"
          if strongText:match("^Tip") then
            calloutType = "tip"
          elseif strongText:match("^Warning") then
            calloutType = "warning"
          elseif strongText:match("^Note") then
            calloutType = "note"
          end
          local div = pandoc.Div(el.content, pandoc.Attr("", {"callout", "callout-" .. calloutType}))
          return div
        end
      end
    end
  end
end
