/* MeetingLens — AI Meeting Transcriber & Summarizer (demo).
   All processing is local. Pure functions are exported for testing in Node;
   DOM wiring only runs in the browser. */

"use strict";

/* ------------------------------------------------------------------ */
/* Pure logic                                                          */
/* ------------------------------------------------------------------ */

var SUMMARY_KEYWORDS = [
  "launch", "price", "pricing", "budget", "deadline", "risk", "decided",
  "agreed", "target", "goal", "pipeline", "demo", "freeze", "cap",
  "pause", "focus", "quarter", "revenue", "margin", "timeline", "date"
];

var DECISION_RE = /\b(decided|agreed|decision|approved|confirmed|settled on|final call|locked in|go with|going with|chosen)\b/i;

var ACTION_VERB_RE = /\b(will|going to|need to|needs to|has to|must)\b[^.!?]{0,70}?\b(finalize|prepare|ship|deliver|send|draft|update|book|check|run|share|add|create|handle|fix|fixed|review|call|email|make|write|test|own|have|freeze)\b/i;

var ASK_RE = /^([A-Z][A-Za-z.'-]{1,30}),?\s+(?:can|could) you\s+(.+?)[.?!]?\s*$/i;

var DUE_RE = /\bby\s+([^,.;]{1,32})/i;
var DUE_ALT_RE = /\b(?:for|on)\s+((?:next\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?)?)\b/i;

function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(function (s) { return s.trim(); })
    .filter(function (s) { return s.length > 1; });
}

function countWords(text) {
  var m = text.match(/\S+/g);
  return m ? m.length : 0;
}

function parseTranscript(raw) {
  var segments = [];
  var lines = String(raw || "").split(/\r?\n/);
  lines.forEach(function (line) {
    line = line.trim();
    if (!line) return;
    var m = line.match(/^([A-Z][A-Za-z.'-]{1,30}):\s*(.+)$/);
    if (m) {
      segments.push({ speaker: m[1], text: m[2].trim() });
    } else if (segments.length) {
      segments[segments.length - 1].text += " " + line;
    } else {
      segments.push({ speaker: "Unattributed", text: line });
    }
  });

  var perSpeaker = {};
  var order = [];
  var totalWords = 0;
  segments.forEach(function (seg) {
    var w = countWords(seg.text);
    totalWords += w;
    if (!perSpeaker[seg.speaker]) { perSpeaker[seg.speaker] = 0; order.push(seg.speaker); }
    perSpeaker[seg.speaker] += w;
  });

  var speakers = order.map(function (name) {
    return { name: name, words: perSpeaker[name] };
  }).sort(function (a, b) { return b.words - a.words; });

  return { segments: segments, speakers: speakers, totalWords: totalWords };
}

function scoreSentence(sentence, isFirst) {
  var lower = sentence.toLowerCase();
  var score = 0;
  SUMMARY_KEYWORDS.forEach(function (kw) {
    if (lower.indexOf(kw) !== -1) score += 3;
  });
  if (isFirst) score += 1;
  if (/\d/.test(sentence)) score += 1;
  var words = countWords(sentence);
  if (words > 30) score -= 2;
  if (words < 5) score -= 2;
  if (/^(also|and)\b/i.test(sentence)) score -= 2;
  return score;
}

function extractSummary(segments, maxSentences) {
  var scored = [];
  segments.forEach(function (seg, segIdx) {
    splitSentences(seg.text).forEach(function (sentence, sentIdx) {
      if (countWords(sentence) < 7) return; // skip fragments like "Agreed on the date."
      scored.push({
        sentence: sentence,
        score: scoreSentence(sentence, sentIdx === 0),
        order: segIdx * 100 + sentIdx
      });
    });
  });
  scored.sort(function (a, b) { return b.score - a.score || a.order - b.order; });
  var picked = scored.slice(0, maxSentences || 4);
  picked.sort(function (a, b) { return a.order - b.order; });
  return picked.map(function (p) { return p.sentence; });
}

function extractDecisions(segments) {
  var out = [];
  segments.forEach(function (seg) {
    splitSentences(seg.text).forEach(function (sentence) {
      if (countWords(sentence) >= 4 && DECISION_RE.test(sentence)) out.push(sentence);
    });
  });
  return out;
}

function cleanTask(sentence) {
  var s = sentence.trim();
  s = s.replace(/^(?:yes|yeah|sure|okay|ok),?\s+/i, "");
  s = s.replace(/^(?:also|and)\s+/i, "");
  s = s.replace(/^(?:I|we|he|she|they)\s+(?:will|am going to|are going to|need to|needs to|have to|must)\s+/i, "");
  s = s.replace(/^also\s+/i, "");
  s = s.replace(/^I\s+(?:also\s+)?/i, "");
  s = s.replace(/[,.;:!?]+$/, "");
  s = s.charAt(0).toUpperCase() + s.slice(1);
  return s;
}

// Split "X and I will Y" into separate commitment clauses.
function actionParts(sentence) {
  return sentence
    .split(/\s+and\s+(?=I\s+(?:will|need to|am going to)\b)/i)
    .map(function (p) { return p.trim(); })
    .filter(function (p) { return p.length > 1; });
}

var DUE_DATE_RE = /\b(?:on|by)\s+((?:december|dec|november|nov|january|jan)\s+\d{1,2}(?:st|nd|rd|th)?)\b/i;

function findDue(sentence) {
  function tidy(due) {
    due = due.trim().replace(/\s+(and|so|then)\b.*$/i, "").replace(/[.?!]+$/g, "").trim();
    if (!due) return null;
    return due.charAt(0).toUpperCase() + due.slice(1);
  }
  var m = sentence.match(DUE_RE);
  if (m) {
    var due = tidy(m[1]);
    if (due) return due;
  }
  var dated = sentence.match(DUE_DATE_RE);
  if (dated) return tidy(dated[1]);
  var alt = sentence.match(DUE_ALT_RE);
  if (alt) return tidy(alt[1]);
  return null;
}

function extractActions(segments) {
  var speakerNames = {};
  segments.forEach(function (seg) { speakerNames[seg.speaker] = true; });

  function stripAddressee(text, owner) {
    var m = text.match(/^([A-Z][A-Za-z.'-]{1,30}),\s+(.+)$/);
    if (m && speakerNames[m[1]] && m[1] !== owner) return m[2];
    return text;
  }

  var actions = [];
  segments.forEach(function (seg) {
    splitSentences(seg.text).forEach(function (sentence) {
      var ask = sentence.match(ASK_RE);
      if (ask) {
        actions.push({
          text: cleanTask(ask[2]),
          owner: ask[1],
          due: findDue(sentence)
        });
        return;
      }
      actionParts(sentence).forEach(function (part) {
        if (ACTION_VERB_RE.test(part)) {
          actions.push({
            text: cleanTask(stripAddressee(part, seg.speaker)),
            owner: seg.speaker,
            due: findDue(part)
          });
        }
      });
    });
  });
  // De-duplicate identical tasks, keep first.
  var seen = {};
  return actions.filter(function (a) {
    var key = a.owner + "|" + a.text.toLowerCase();
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

function analyze(rawText, durationMinutes) {
  var parsed = parseTranscript(rawText);
  var summary = extractSummary(parsed.segments, 4);
  var decisions = extractDecisions(parsed.segments);
  var actions = extractActions(parsed.segments);
  var duration = durationMinutes && durationMinutes > 0
    ? Math.round(durationMinutes)
    : Math.max(1, Math.round(parsed.totalWords / 150));
  var speakerShare = parsed.speakers.map(function (s) {
    return {
      name: s.name,
      words: s.words,
      pct: parsed.totalWords ? Math.round((s.words / parsed.totalWords) * 100) : 0
    };
  });
  return {
    segments: parsed.segments,
    speakers: parsed.speakers,
    totalWords: parsed.totalWords,
    summary: summary,
    decisions: decisions,
    actions: actions,
    duration: duration,
    speakerShare: speakerShare
  };
}

/* ------------------------------------------------------------------ */
/* Export builders                                                     */
/* ------------------------------------------------------------------ */

function metaLine(meta) {
  var parts = [];
  if (meta.date) parts.push("Date: " + meta.date);
  parts.push("Duration: " + meta.duration + " min");
  parts.push("Speakers: " + meta.speakers);
  parts.push("Words: " + meta.words);
  return parts.join("  ·  ");
}

function buildText(result, meta) {
  var lines = [];
  lines.push(meta.title.toUpperCase());
  lines.push(metaLine(meta));
  lines.push("");
  lines.push("SUMMARY");
  result.summary.forEach(function (s) { lines.push("- " + s); });
  lines.push("");
  lines.push("DECISIONS");
  if (result.decisions.length) {
    result.decisions.forEach(function (d) { lines.push("- " + d); });
  } else {
    lines.push("- None recorded.");
  }
  lines.push("");
  lines.push("ACTION ITEMS");
  if (result.actions.length) {
    result.actions.forEach(function (a) {
      lines.push("- [ ] " + a.text + " — " + a.owner + (a.due ? ", due " + a.due : ", no date set"));
    });
  } else {
    lines.push("- None recorded.");
  }
  lines.push("");
  lines.push("SPEAKING TIME");
  result.speakerShare.forEach(function (s) {
    lines.push("- " + s.name + ": " + s.pct + "% (" + s.words + " words)");
  });
  lines.push("");
  lines.push("Notes generated by MeetingLens (demo).");
  return lines.join("\n");
}

function buildMarkdown(result, meta) {
  var lines = [];
  lines.push("# " + meta.title);
  lines.push("");
  lines.push(metaLine(meta));
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  result.summary.forEach(function (s) { lines.push("- " + s); });
  lines.push("");
  lines.push("## Decisions");
  lines.push("");
  if (result.decisions.length) {
    result.decisions.forEach(function (d) { lines.push("- " + d); });
  } else {
    lines.push("_None recorded._");
  }
  lines.push("");
  lines.push("## Action items");
  lines.push("");
  if (result.actions.length) {
    result.actions.forEach(function (a) {
      lines.push("- [ ] **" + a.text + "** — " + a.owner + (a.due ? " (due " + a.due + ")" : " (no date set)"));
    });
  } else {
    lines.push("_None recorded._");
  }
  lines.push("");
  lines.push("## Speaking time");
  lines.push("");
  result.speakerShare.forEach(function (s) {
    lines.push("- **" + s.name + "**: " + s.pct + "% (" + s.words + " words)");
  });
  lines.push("");
  lines.push("---");
  lines.push("_Notes generated by MeetingLens (demo)._");
  return lines.join("\n");
}

function slugify(text) {
  return String(text || "meeting-notes").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "meeting-notes";
}

/* ------------------------------------------------------------------ */
/* Browser UI                                                          */
/* ------------------------------------------------------------------ */

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", function () {
    var $ = function (id) { return document.getElementById(id); };

    var titleInput = $("meetingTitle");
    var dateInput = $("meetingDate");
    var durationInput = $("meetingDuration");
    var input = $("transcriptInput");
    var analyzeBtn = $("analyzeBtn");
    var clearBtn = $("clearBtn");
    var emptyState = $("emptyState");
    var resultsEl = $("results");
    var outputHint = $("outputHint");
    var toastEl = $("toast");

    var samples = (typeof window !== "undefined" && window.MEETING_SAMPLES) || [];
    var current = null; // { result, meta }

    var toastTimer = null;
    function toast(msg) {
      toastEl.textContent = msg;
      toastEl.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 2200);
    }

    function updateCounters() {
      var text = input.value;
      var parsed = parseTranscript(text);
      $("charCount").textContent = text.length.toLocaleString("en-US") + " characters";
      $("wordCount").textContent = parsed.totalWords.toLocaleString("en-US") + " words";
      $("speakerCount").textContent = parsed.speakers.length + (parsed.speakers.length === 1 ? " speaker" : " speakers");
    }

    function getMeta(result) {
      return {
        title: titleInput.value.trim() || "Untitled meeting",
        date: dateInput.value || "",
        duration: result.duration,
        speakers: result.speakers.length,
        words: result.totalWords
      };
    }

    function esc(s) {
      return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function render(result) {
      var meta = getMeta(result);
      current = { result: result, meta: meta };

      $("statDuration").textContent = result.duration + " min";
      $("statSpeakers").textContent = result.speakers.length;
      $("statWords").textContent = result.totalWords.toLocaleString("en-US");
      $("statDecisions").textContent = result.decisions.length;
      $("statActions").textContent = result.actions.length;

      $("summaryBody").innerHTML = result.summary.length
        ? result.summary.map(function (s) { return "<p>" + esc(s) + "</p>"; }).join("")
        : "<p>No summary could be generated from this transcript.</p>";

      var dList = $("decisionsList");
      dList.innerHTML = result.decisions.map(function (d) { return "<li>" + esc(d) + "</li>"; }).join("");
      $("noDecisions").hidden = result.decisions.length > 0;

      var aList = $("actionsList");
      aList.innerHTML = result.actions.map(function (a, i) {
        return '<div class="action-item">' +
          '<button type="button" class="action-check" data-idx="' + i + '" aria-label="Mark done"></button>' +
          '<div class="action-body"><p class="action-text">' + esc(a.text) + '</p>' +
          '<div class="action-meta"><span class="owner-tag">' + esc(a.owner) + '</span>' +
          '<span class="due-tag' + (a.due ? "" : " none") + '">' + (a.due ? "Due " + esc(a.due) : "No date set") + '</span></div>' +
          '</div></div>';
      }).join("");
      $("noActions").hidden = result.actions.length > 0;

      var barColors = ["var(--bar-1)", "var(--bar-2)", "var(--bar-3)", "var(--bar-4)", "var(--bar-5)", "var(--bar-6)"];
      $("speakersList").innerHTML = result.speakerShare.map(function (s, i) {
        return '<div class="speaker-row"><span class="speaker-name">' + esc(s.name) + '</span>' +
          '<span class="speaker-track"><span class="speaker-fill" style="display:block;width:' + s.pct + '%;background:' + barColors[i % barColors.length] + '"></span></span>' +
          '<span class="speaker-pct">' + s.pct + '%</span></div>';
      }).join("");

      emptyState.hidden = true;
      resultsEl.hidden = false;
      outputHint.textContent = "Analyzed just now · " + result.actions.length + " action items";
      resultsEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function runAnalyze() {
      var text = input.value.trim();
      if (!text) {
        toast("Paste a transcript first — or load a sample.");
        input.focus();
        return;
      }
      var dur = parseInt(durationInput.value, 10);
      render(analyze(text, isNaN(dur) ? 0 : dur));
      toast("Meeting summarized.");
    }

    function loadSample(id) {
      var sample = samples.filter(function (s) { return s.id === id; })[0];
      if (!sample) return;
      titleInput.value = sample.title;
      dateInput.value = sample.date;
      durationInput.value = sample.duration;
      input.value = sample.transcript;
      document.querySelectorAll(".chip").forEach(function (chip) {
        chip.classList.toggle("active", chip.getAttribute("data-sample") === id);
      });
      updateCounters();
      runAnalyze();
    }

    function copyText(text, msg) {
      function done() { toast(msg || "Copied to clipboard."); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
      } else {
        fallbackCopy(text);
        done();
      }
    }

    function fallbackCopy(text) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (e) { /* clipboard unavailable */ }
      document.body.removeChild(ta);
    }

    function download(filename, text) {
      var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 500);
      toast("Downloaded " + filename);
    }

    input.addEventListener("input", updateCounters);
    analyzeBtn.addEventListener("click", runAnalyze);
    clearBtn.addEventListener("click", function () {
      input.value = "";
      titleInput.value = "";
      resultsEl.hidden = true;
      emptyState.hidden = false;
      outputHint.textContent = "Waiting for a transcript";
      document.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("active"); });
      updateCounters();
      input.focus();
    });
    document.querySelectorAll(".chip").forEach(function (chip) {
      chip.addEventListener("click", function () { loadSample(chip.getAttribute("data-sample")); });
    });

    document.querySelectorAll("[data-copy]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!current) return;
        var kind = btn.getAttribute("data-copy");
        var text = "";
        if (kind === "summary") text = current.result.summary.join(" ");
        if (kind === "decisions") text = current.result.decisions.map(function (d) { return "- " + d; }).join("\n");
        if (kind === "actions") {
          text = current.result.actions.map(function (a) {
            return "- [ ] " + a.text + " — " + a.owner + (a.due ? ", due " + a.due : ", no date set");
          }).join("\n");
        }
        copyText(text, "Section copied.");
      });
    });

    $("copyAllBtn").addEventListener("click", function () {
      if (!current) return;
      copyText(buildText(current.result, current.meta), "All notes copied.");
    });
    $("downloadTxtBtn").addEventListener("click", function () {
      if (!current) return;
      download(slugify(current.meta.title) + "-notes.txt", buildText(current.result, current.meta));
    });
    $("downloadMdBtn").addEventListener("click", function () {
      if (!current) return;
      download(slugify(current.meta.title) + "-notes.md", buildMarkdown(current.result, current.meta));
    });

    $("actionsList").addEventListener("click", function (e) {
      var btn = e.target.closest(".action-check");
      if (!btn) return;
      btn.classList.toggle("done");
      var textEl = btn.parentElement.querySelector(".action-text");
      if (textEl) textEl.classList.toggle("done");
    });

    updateCounters();
  });
}

/* Node export for smoke tests */
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    parseTranscript: parseTranscript,
    extractSummary: extractSummary,
    extractDecisions: extractDecisions,
    extractActions: extractActions,
    analyze: analyze,
    buildMarkdown: buildMarkdown,
    buildText: buildText,
    slugify: slugify
  };
}
