/** Editorial copy for the guide and policy pages. Admin-editable later. */

export const FAQS = [
  {
    group: 'Buying',
    items: [
      {
        q: 'Do you have the colour I saw on Instagram?',
        a: 'Every colour we have ever run has a code on our dye card, and the code is printed on the product page. Send us the post on WhatsApp and we will tell you the code and whether it is still in stock.',
      },
      {
        q: 'Will the colour match my screen?',
        a: 'Close, not exact — no two screens show a colour the same way, and dye lots vary slightly between runs. If an exact match matters, message us before ordering and we will tell you honestly how close it is. Hand tie-dyed pieces vary the most, and we say so on those pages.',
      },
      {
        q: 'How do I know which one is opaque enough?',
        a: 'Weight is the best guide. Anything over 150 GSM — our jerseys and the Turkish cotton — needs no under-cap. Chiffons and georgettes under 80 GSM are sheer, and we say so in the description. If you are unsure about a specific piece, message us and we will tell you straight.',
      },
    ],
  },
  {
    group: 'Payment',
    items: [
      {
        q: 'Is cash on delivery available?',
        a: 'Not at the moment — every order is paid by UPI. It keeps our costs down, which is where the 5% prepaid discount comes from, and it means nothing is ever refused at the door. If UPI is genuinely not an option for you, message us on WhatsApp and we will sort something out.',
      },
      {
        q: 'How does UPI payment work here?',
        a: 'At checkout you get a QR with the amount already filled in, or a tap-through link for GPay, PhonePe and Paytm. After paying you enter the 12-digit UTR from your app history. We match it against our bank statement by hand, usually within a few hours, and then your order moves to packing.',
      },
      {
        q: 'Why is there a discount for paying by UPI?',
        a: 'UPI costs us nothing to accept — no gateway fee, no collection charge. Rather than keep that, we pass 5% of it back to you.',
      },
      {
        q: 'Can I pay by card?',
        a: 'Not yet. Cards, net banking and wallets arrive when we finish the payment-gateway integration. Until then it is UPI or cash on delivery.',
      },
    ],
  },
  {
    group: 'Delivery & returns',
    items: [
      {
        q: 'How long does delivery take?',
        a: 'Standard is 4–7 working days and free over ₹999. Orders placed before 2pm IST dispatch the same day. Bridal and made-to-order pieces ship in 12–16 days. Express delivery is coming soon.',
      },
      {
        q: 'Can I return something?',
        a: 'Within 7 days of delivery, unworn and unwashed with the tags still on. We refund to the original payment method, or to a UPI ID you give us for COD orders. Bridal and made-to-order pieces are final sale, because they are cut and beaded for you specifically.',
      },
      {
        q: 'Something arrived damaged.',
        a: 'Photograph it before you unpack any further and message us on WhatsApp the same day. We replace it and cover the return pickup — no argument, no restocking fee.',
      },
      {
        q: 'Do you ship outside India?',
        a: 'Not yet. We get asked most often about the UAE, UK and Canada, and we are working on it. Join the list in the footer and we will tell you when it opens.',
      },
    ],
  },
  {
    group: 'Care',
    items: [
      {
        q: 'Can I machine wash these?',
        a: 'Jersey and modal, yes — cold, gentle cycle, mesh bag. Chiffon, georgette, satin and anything crinkled or pleated should be hand washed cold. Every product page carries its own care line; follow that over anything general.',
      },
      {
        q: 'The crinkle came out of my chiffon.',
        a: 'It should not — ours is heat-set, not pressed. If it has relaxed, you have almost certainly ironed it or tumble-dried it hot. Send us a photo and we will tell you whether it can be recovered.',
      },
      {
        q: 'How do I stop a satin hijab slipping?',
        a: 'A ribbed or jersey under-cap gives the satin something to grip. Magnets hold better than pins on satin, because a pin leaves a visible hole in a satin float.',
      },
    ],
  },
]

export const STYLING_STEPS = [
  {
    name: 'The everyday wrap',
    time: '40 seconds',
    best: 'Modal, jersey, Turkish cotton',
    steps: [
      'Put the under-cap on first and push your hairline back under it.',
      'Centre the hijab with the short side falling to your weaker hand — about 20 cm on that side, the rest on the other.',
      'Pin once under the chin, close to the jaw rather than at the throat.',
      'Take the long end around the back, bring it forward over the opposite shoulder, and let the last 15 cm fall loose.',
    ],
  },
  {
    name: 'The pinless crinkle',
    time: '15 seconds',
    best: 'Crinkle chiffon, ribbed jersey',
    steps: [
      'Skip the cap on a heavier jersey — anything over 150 GSM sits opaque on its own.',
      'Centre it with both ends equal.',
      'Cross the ends under your chin and pull gently — crinkle grips crinkle, so it holds itself.',
      'Tuck both ends back over opposite shoulders. Nothing to pin.',
    ],
  },
  {
    name: 'The occasion drape',
    time: '2 minutes',
    best: 'Satin, shimmer georgette, silk tulle',
    steps: [
      'Start with a jersey cap — satin needs something with texture to sit against.',
      'Leave one end long, nearly to the hip.',
      'Pin under the chin with a magnet rather than a pin; a pin leaves a hole in a satin float.',
      'Pleat the long end in three across the shoulder, hold the pleats, and pin the stack once from underneath.',
      'Let the shorter end fall behind the shoulder so the folds catch the light.',
    ],
  },
]

export const CARE_RULES = [
  {
    fabric: 'Modal & bamboo viscose',
    wash: 'Machine, cold, gentle',
    dry: 'Line dry in shade',
    iron: 'Warm, inside out',
    note: 'Modal softens for about ten washes and then stops changing. Do not wring it — it holds water and stretches while wet.',
  },
  {
    fabric: 'Cotton-modal & ribbed jersey',
    wash: 'Machine, cold, mesh bag',
    dry: 'Tumble low, or flat',
    iron: 'Rarely needed',
    note: 'Reshape while damp and it will keep its width. Hot tumble drying is what kills the elastane.',
  },
  {
    fabric: 'Crinkle chiffon',
    wash: 'Hand, cold',
    dry: 'Hang dripping wet',
    iron: 'Never',
    note: 'The crinkle is a heat-set finish. An iron is the one thing that can flatten it permanently.',
  },
  {
    fabric: 'Pleated chiffon',
    wash: 'Hand, cold',
    dry: 'Hang, never folded',
    iron: 'Never',
    note: 'Folding it while wet sets a crease across the pleats that will not come out.',
  },
  {
    fabric: 'Satin & shimmer georgette',
    wash: 'Dry clean, or hand cold',
    dry: 'Flat on a towel',
    iron: 'Cool, on the crepe face',
    note: 'Do not wring. Roll it in a towel and press the water out instead.',
  },
  {
    fabric: 'Cotton voile',
    wash: 'Machine, warm',
    dry: 'Line dry',
    iron: 'Hot — it likes it',
    note: 'The only fabric we sell that genuinely improves with a hot iron.',
  },
  {
    fabric: 'Silk tulle, embellished',
    wash: 'Dry clean only',
    dry: '—',
    iron: 'Never',
    note: 'Store rolled in tissue, never on a hanger — the bead weight will pull the tulle out of shape.',
  },
]

export const SIZE_GUIDE = [
  {
    cut: 'Rectangle, 75 × 185 cm',
    who: 'The default. Wraps twice with enough left to drape.',
    note: 'If you are over 5′7″ or wear a lot of volume underneath, take the 190 or 195 cm instead.',
  },
  {
    cut: 'Rectangle, 70 × 175 cm',
    who: 'Jersey and instant styles, where the stretch makes up the difference.',
    note: 'Stretch adds roughly 10 cm of usable length, so this behaves like a 185.',
  },
  {
    cut: 'Rectangle, 70 × 200 cm',
    who: 'Occasion drapes that need a long tail for pleating.',
    note: 'Too much cloth for daily wear — it bunches at the shoulder.',
  },
  {
    cut: 'Square, 105–110 cm',
    who: 'Folded to a triangle, worn the traditional way.',
    note: 'A 110 gives a deeper point at the back than a 105. Below 100 it sits too high on the shoulder.',
  },
  {
    cut: 'Shawl, 95 × 220 cm',
    who: 'Bridal and heavily embellished pieces.',
    note: 'Wide enough to cover the shoulders completely, which is what the bead work is for.',
  },
]

export const POLICIES = {
  shipping: {
    title: 'Shipping',
    updated: 'March 2026',
    body: [
      { h: 'Where we ship', p: 'Everywhere in India, to any serviceable PIN code. We do not ship internationally yet.' },
      { h: 'What it costs', p: 'Standard delivery is ₹79, and free on orders over ₹999. Express delivery is not running yet — when it is, it will be ₹199 and never free, because it costs us the same on a ₹500 order as on a ₹5,000 one.' },
      { h: 'How long it takes', p: 'Standard arrives in 4–7 working days. Metro PIN codes are usually at the fast end of that range. Orders placed before 2pm IST are dispatched the same day; after that, the next working day.' },
      { h: 'Made-to-order pieces', p: 'Bridal and hand-embellished pieces take 12–16 days before they ship, because one karigar works each piece from start to finish. The dispatch email tells you the day it leaves us.' },
      { h: 'Tracking', p: 'You get an AWB number and a courier link by email and SMS the moment a parcel is handed over. If the tracking has not updated for 48 hours, message us — we will chase the courier rather than asking you to.' },
      { h: 'If nobody is home', p: 'Couriers try twice. After a second failed attempt the parcel comes back to us and we refund prepaid orders in full. For COD orders we will ask before re-dispatching.' },
    ],
  },
  returns: {
    title: 'Returns & exchange',
    updated: 'March 2026',
    body: [
      { h: 'The window', p: 'Seven days from the day it is delivered. Start the return by replying to your order email or messaging us on WhatsApp with the order number.' },
      { h: 'Condition', p: 'Unworn, unwashed, tags on, in the original packing. We check for perfume, make-up marks and pin holes — anything worn out of the house is not returnable.' },
      { h: 'What is final sale', p: 'Bridal and made-to-order pieces, and any item marked final sale on its product page. These are cut and beaded for you specifically, so we cannot resell them.' },
      { h: 'Exchanges', p: 'A straight swap for a different colourway or cut of the same value is free — we pay the return pickup and the re-dispatch. Only one exchange per order.' },
      { h: 'Refunds', p: 'Refunds go back to the UPI ID you paid from, within 3–5 working days of the parcel reaching us. We do not send cash or cheques.' },
      { h: 'Damaged or wrong item', p: 'Photograph it before unpacking further and message us the same day. We replace it, cover the pickup, and do not ask you to return it before the replacement ships.' },
      { h: 'Shipping charges', p: 'Original shipping is not refunded on a change-of-mind return. It is refunded in full if the fault was ours.' },
    ],
  },
  privacy: {
    title: 'Privacy',
    updated: 'March 2026',
    body: [
      { h: 'What we collect', p: 'Your name, delivery address, email and mobile number — the minimum needed to send you a parcel and tell you where it is. If you pay by UPI we also store the 12-digit reference number so we can match your payment.' },
      { h: 'What we do not collect', p: 'We never see or store card numbers, UPI PINs or bank credentials. Payment happens inside your own app.' },
      { h: 'Who we share it with', p: 'Your name, address and phone number go to the courier carrying your parcel. Nothing else, to nobody else. We do not sell or rent customer data.' },
      { h: 'Marketing', p: 'We email you only if you asked us to. Every email has a working unsubscribe link, and using it does not affect your order updates.' },
      { h: 'How long we keep it', p: 'Order records for seven years, because tax law requires it. Marketing contacts until you unsubscribe.' },
      { h: 'Your rights', p: 'Ask us for a copy of everything we hold on you, or ask us to delete it, and we will do it within 30 days. Email us and mention "data request" in the subject.' },
      { h: 'Cookies', p: 'We use local storage to remember your bag and saved items between visits. There is no advertising tracker on this site.' },
    ],
  },
  terms: {
    title: 'Terms of sale',
    updated: 'March 2026',
    body: [
      { h: 'Who you are buying from', p: 'Hijabisaura, Unit 4, Mehrab House, Mohammed Ali Road, Mumbai 400003. GSTIN 27AABCH1234K1ZQ. All prices are in Indian rupees and include GST.' },
      { h: 'When the contract starts', p: 'When we send your order confirmation, not when you press the button. If something has gone out of stock between the two, we will tell you and refund immediately.' },
      { h: 'Pricing errors', p: 'If a price is obviously wrong — a ₹1,699 satin listed at ₹169 — we will cancel and refund rather than honour it, and we will tell you why.' },
      { h: 'Product variation', p: 'Colour varies slightly between dye lots, and hand tie-dyed and hand-embellished pieces vary by design. Product pages say so where it applies. This is not a defect.' },
      { h: 'Fabric specification', p: 'Fabric, weave, GSM, dimensions and composition are passed on from our mills as supplied to us. They are accurate to the best of our knowledge and are a guide to help you choose, not a warranty of a specific physical property.' },
      { h: 'Payment', p: 'Orders are paid by UPI before dispatch. We verify each payment against our bank statement by hand, usually within a few hours, and nothing is packed until it clears.' },
      { h: 'Disputes', p: 'Indian law applies and the courts of Mumbai have jurisdiction. Before any of that, message us — almost everything is solved in one WhatsApp exchange.' },
    ],
  },
}
