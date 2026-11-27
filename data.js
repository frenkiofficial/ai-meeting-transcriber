/* AI Meeting Transcriber & Summarizer — sample transcripts (demo data only). */
window.MEETING_SAMPLES = [
  {
    id: "launch",
    title: "Product Launch Planning",
    date: "2026-11-24",
    duration: 42,
    label: "Product launch planning",
    blurb: "4 speakers · 42 min · launch date, pricing & promo plan",
    transcript: [
      "Maya: Good morning everyone, let's get started. We have six weeks until launch day, so today we need to lock the date, the price, and the promo plan.",
      "Daniel: Quick update from engineering first. The checkout flow is done and tested, but the discount-code bug is still open. It only triggers when a code is stacked with a bundle.",
      "Maya: How bad is it? Can we ship with it?",
      "Daniel: We can, but I would rather not. A customer hitting that bug on day one would be a terrible first impression. Give me three days and I will have it fixed.",
      "Priya: Three days is fine. The email sequence does not go out until next week anyway, so the timeline still works.",
      "Tom: Design is nearly there too. The hero visuals are approved, I am just waiting on the final product photos from the shoot yesterday.",
      "Maya: Good. So decision one: we launch on December 12. That gives engineering the fix window and marketing a full week of warm-up.",
      "Daniel: December 12 works for us. We will freeze the code on December 8 so nothing last-minute breaks the build.",
      "Priya: Agreed on the date. On pricing, I ran the numbers again. At 49 dollars we convert well and still keep a healthy margin, but at 59 we lose about a fifth of the early buyers.",
      "Maya: Then we go with 49 dollars for the early-bird window, and it goes up to 59 after the first week. That creates urgency and protects margin.",
      "Tom: I like that. The landing page can show the early-bird price with a countdown to the price increase.",
      "Priya: One risk to flag. Our ad account was throttled last month, so I do not want to bet the whole launch on paid ads. We should lean on the email list and the partner shout-outs.",
      "Maya: Fair point. We decided to cap paid spend at 2,000 dollars for launch week and put the rest of the effort into email and partners.",
      "Daniel: Sounds right. I will also add a status page link to the footer, so if anything goes wrong on launch day, customers can see we are on it.",
      "Tom: I will deliver the final hero visuals by December 1, and I can make a shorter version for the email headers too.",
      "Priya: I will prepare the email sequence by December 2, three emails, and the partner kit by December 4.",
      "Daniel: I need to ship the checkout fix by November 30. Maya, I will send you the test link as soon as it is on staging.",
      "Maya: Perfect. I will finalize the landing page copy by Friday, and I will book the launch-day war room for December 12.",
      "Tom: One more thing, the demo video. Do we cut it to 60 seconds or keep the full two minutes?",
      "Maya: We agreed to keep the 60-second cut for ads and the full version on the landing page. Tom, can you handle both versions?",
      "Tom: Yes, I will have both cuts ready by December 3.",
      "Maya: Great, that wraps it up. Same time next Tuesday, and I will send the recap tonight."
    ].join("\n")
  },
  {
    id: "sales",
    title: "Weekly Sales Sync",
    date: "2026-11-23",
    duration: 28,
    label: "Weekly sales sync",
    blurb: "3 speakers · 28 min · pipeline review & Q4 push",
    transcript: [
      "Alex: Morning team, quick sync. We are at 71 percent of the Q4 target with five weeks left, so we need a strong push on the enterprise pipeline.",
      "Jordan: The good news is that Northwind finally replied. They want a demo next Tuesday with their ops lead in the room, and their budget is approved for this quarter.",
      "Alex: That is the biggest deal in the pipe. If it closes, we are at 84 percent. Jordan, can you own the demo prep?",
      "Jordan: Yes, I will prepare the demo script by Monday and run a dry run with Sam on Monday afternoon.",
      "Sam: I can join the dry run. I also have the new case study ready, the one with the logistics client, so we can use their numbers in the deck.",
      "Alex: Great, add the case study to the deck. Decision for today: we pause the small-business outbound for two weeks and put all hands on the five enterprise deals.",
      "Jordan: Agreed. The small deals take the same effort for a tenth of the revenue, so focusing makes sense.",
      "Sam: One concern, though. Two of the five enterprise accounts have gone quiet for over a week. Should we send a break-up email?",
      "Alex: We decided to send a short check-in first, not a break-up email. Sam, can you draft it by Wednesday?",
      "Sam: I will draft the check-in email by Wednesday and share it in the channel for a quick review.",
      "Jordan: Also, the pricing sheet is out of date. It still shows the old annual discount, and Northwind will notice.",
      "Alex: Good catch. I will update the pricing sheet by Thursday and send the new version to the whole team.",
      "Jordan: I will also book the follow-up call with Northwind for next Tuesday at 10am, right after the demo.",
      "Sam: And I will send the updated pipeline report by Friday so we can see exactly where we stand before the weekend.",
      "Alex: Perfect. Anything else? No? Then we are done. Same time next Monday."
    ].join("\n")
  }
];
