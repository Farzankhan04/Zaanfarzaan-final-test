/* ===================================================================
   ZAAN FARZAAN — URDU TRANSLITERATION ENGINE (ur-translit.js)
   Converts the site's Devanagari poem text (which already carries
   Urdu vocabulary, incl. nuqta letters क़ ख़ ग़ ज़ ड़ ढ़ फ़) into Urdu
   (Nastaliq) SCRIPT — a script change only, the words themselves are
   not translated. This mirrors how the English button transliterates
   into Roman script for ghazals/nazms.

   Approach: a curated word dictionary (ZF_UR_WORDS) handles the
   ~300+ most frequent words and the ones where Urdu spelling can't
   be derived from pronunciation alone (e.g. ज़ बनाम ز/ذ/ض/ظ, स बनाम
   س/ص/ث, त बनाम ت/ط, ह बनाम ہ/ح). Anything not in the dictionary
   falls back to a rule-based letter-by-letter transliteration.
   =================================================================== */
(function(){

  var ZF_UR_WORDS_RAW = {"है":"ہے","से":"سے","को":"کو","में":"میں","भी":"بھی","ही":"ہی","मैं":"میں","तो":"تو","की":"کی","हो":"ہو","के":"کے","वो":"وہ","नहीं":"نہیں","न":"نہ","ये":"یہ","था":"تھا","का":"کا","ए":"اے","क्या":"کیا","मुझ":"مجھ","कर":"کر","अब":"اب","उस":"اس","कि":"کہ","जो":"جو","इस":"اس","ने":"نے","इक":"اک","फिर":"پھر","हूँ":"ہوں","जब":"جب","पर":"پر","हर":"ہر","तू":"تو","हैं":"ہیں","होता":"ہوتا","दिल":"دل","कुछ":"کچھ","हुआ":"ہوا","बस":"بس","कोई":"کوئی","और":"اور","मुझे":"مجھے","मेरे":"میرے","थी":"تھی","सब":"سب","क्यूँ":"کیوں","थे":"تھے","यूँ":"یوں","ख़ुद":"خود","बे":"بے","रही":"رہی","मेरी":"میری","जाने":"جانے","जिस":"جس","मिरे":"مرے","मगर":"مگر","तुम":"تم","जाए":"جائے","रहा":"رہا","तेरे":"تیرے","पे":"پہ","अगर":"اگر","साथ":"ساتھ","जहाँ":"جہاں","दुनिया":"دنیا","गर":"گر","या":"یا","किसी":"کسی","मिरी":"مری","कौन":"کون","देते":"دیتے","गए":"گئے","आप":"آپ","हम":"ہم","बहुत":"بہت","रहे":"رہے","लोगों":"لوگوں","ग़म":"غم","इतना":"اتنا","तिरी":"تری","समझ":"سمجھ","इन":"ان","अल्लाह":"اللہ","तुझ":"تجھ","ख़ुदा":"خدا","तब":"تب","कब":"کب","याद":"یاد","कभी":"کبھی","तक":"تک","बात":"بات","तेरी":"تیری","मुश्किल":"مشکل","शायद":"شاید","सो":"سو","अपने":"اپنے","कल":"کل","ऐसा":"ایسا","ज़रूरत":"ضرورت","सामने":"سامنے","रब":"رب","अंदर":"اندر","तिरे":"ترے","ओ":"او","गया":"گیا","कम":"کم","बार":"بار","आ":"آ","आदत":"عادت","गई":"گئی","नइं":"نہیں","लीजिए":"لیجیے","आइना":"آئنہ","मत":"مت","क़दर":"قدر","ख़ुश":"خوش","एक":"ایک","मिल":"مل","उन":"ان","दिन":"دن","आदमी":"آدمی","कैसे":"کیسے","मोहब्बत":"محبت","तेरा":"تیرا","आया":"آیا","ना":"نا","मुझको":"مجھ کو","कहता":"کہتا","मिरा":"مرا","अभी":"ابھی","मेरा":"میرا","जैसा":"جیسا","करूँगा":"کروں گا","होगा":"ہوگا","काम":"کام","छोड़":"چھوڑ","बैठा":"بیٹھا","ज़िंदगी":"زندگی","पीछे":"پیچھے","मन":"من","सुन":"سن","बा'ज़":"بعض","ख़ूब":"خوب","जगह":"جگہ","बशर":"بشر","शख़्स":"شخص","किस":"کس","उसे":"اسے","नया":"نیا","बा'द":"بعد","देख":"دیکھ","दम":"دم","किया":"کیا","आज":"آج","लगा":"لگا","हाँ":"ہاں","होने":"ہونے","सकता":"سکتا","दस्तियाब":"دستیاب","तरह":"طرح","आता":"آتا","नज़र":"نظر","आए":"آئے","लोग":"لوگ","अक्सर":"اکثر","औक़ात":"اوقات","हों":"ہوں","पास":"پاس","फ़क़त":"فقط","मंज़िल":"منزل","सफ़र":"سفر","चल":"چل","यहाँ":"یہاں","समझता":"سمجھتا","अच्छा":"اچھا","सोचता":"سوچتا","दरिया":"دریا","ऐ":"اے","मियाँ":"میاں","लिए":"لیے","इश्क़":"عشق","रिश्ता":"رشتہ","तन्हा":"تنہا","आँखों":"آنکھوں","कहा":"کہا","होती":"ہوتی","चाहता":"چاہتا","हाथ":"ہاتھ","पहले":"پہلے","मिला":"ملا","माना":"مانا","निकल":"نکل","हाल":"حال","दोनों":"دونوں","अहमियत":"اہمیت","कली":"کلی","मौसम":"موسم","याँ":"یاں","नम":"نم","वफ़ा":"وفا","गोया":"گویا","तलक":"تلک","ज़ेहन":"ذہن","सहरा":"صحرا","जिन":"جن","करने":"کرنے","अपनी":"اپنی","बेहतर":"بہتر","बाहर":"باہر","जा":"جا","भले":"بھلے","आख़िर":"آخر","दी":"دی","हुई":"ہوئی","मिली":"ملی","अज़":"از","दूसरे":"دوسرے","तन्हाई":"تنہائی","घर":"گھر","देता":"دیتا","कह":"کہہ","रात":"رات","अपनों":"اپنوں","हुए":"ہوئے","करना":"کرنا","प्यारे":"پیارے","जाँ":"جاں","सोचा":"سوچا","मानो":"مانو","बिन":"بن","फ़िक्र":"فکر","इतने":"اتنے","मिले":"ملے","ज़ख़्म":"زخم","जैसे":"جیسے","आते":"آتے","ख़ैरियत":"خیریت","परवा":"پروا","अगरचे":"اگرچہ","करती":"کرتی","किरदार":"کردار","पड़":"پڑ","सबब":"سبب","रक्खा":"رکھا","पा":"پا","गवारा":"گوارا","तुझे":"تجھے","सर":"سر","पता":"پتا","हासिल":"حاصل","दर":"در","महफ़िल":"محفل","तर्क":"ترک","त'अल्लुक़":"تعلق","रोज़":"روز","फ़र्दा":"فردا","मलाल":"ملال","जान":"جان","अच्छे":"اچھے","थक":"تھک","सदा":"سدا","कमज़ोर":"کمزور","पुर":"پر","क़िस्मत":"قسمت","वाक़िफ़":"واقف","हार":"ہار","मुयस्सर":"میسر","देखो":"دیکھو","इसी":"اسی","जिस्म":"جسم","वही":"وہی","शय":"شے","उसी":"اسی","चाहे":"چاہے","ख़ू":"خو","दोस्ती":"دوستی","करी":"کری","अच्छी":"اچھی","मरहम":"مرہم","हाजत":"حاجت","आग":"آگ","सा":"سا","जाते":"جاتے","पल":"پل","जी":"جی","आगे":"آگے","ख़ल्वत":"خلوت","आसान":"آسان","मुमकिन":"ممکن","दर्जा":"درجہ","कहते":"کہتے","जानता":"جانتا","आह":"آہ","होना":"ہونا","शामिल":"شامل","आँखें":"آنکھیں","शाद":"شاد","संग":"سنگ","रह":"رہ","राएगाँ":"رائیگاں","हुस्न":"حسن","वहाँ":"وہاں","बहार":"بہار","डाला":"ڈالا","उदासी":"اداسی","बड़ी":"بڑی","लाज़मी":"لازمی","आरज़ू":"آرزو","बड़ा":"بڑا","देर":"دیر","ब":"بہ","आती":"آتی","तन":"تن","ख़ातिर":"خاطر","रख":"رکھ","लाख":"لاکھ","दवा":"دوا","सिर्फ़":"صرف","रास्ता":"راستہ","दर्द":"درد","सूरत":"صورت","ख़ुशबू":"خوشبو","खुला":"کھلا","सभी":"سبھی","लहजे":"لہجے","कितनी":"کتنی","बिलकुल":"بالکل","कहाँ":"کہاں","अगले":"اگلے","ज़रा":"ذرا","नेट":"نیٹ","स्टॉप":"اسٹاپ","दरवाज़ा":"دروازہ","तोड़":"توڑ","चीज़ें":"چیزیں","ज़ान":"زاں","नज़रिए":"نظریے","गुफ़्तुगू":"گفتگو","बे-ग़रज़":"بے غرض","बे-परवा":"بے پروا","ख़ूब-सूरत":"خوب صورت","बड़े":"بڑے","सारी":"ساری","हल":"حل","फ़िक्र-ए-फ़र्दा":"فکرِ فردا","ज़ख़्म-ए-दिल":"زخمِ دل","मजबूरी":"مجبوری","हर-सू":"ہر سو","क़िस्में":"قسمیں","मुस्तक़बिल":"مستقبل","जानिब":"جانب","तारीकी":"تاریکی","अफ़्सुर्दगी":"افسردگی","महसूस":"محسوس","पेश्तर":"پیشتر","सियह":"سیاہ","आमद":"آمد","जज़्बात":"جذبات","हालात":"حالات","रंज":"رنج","बे-बसी":"بے بسی","बे-कली":"بے کلی","तैश":"طیش","दाग़":"داغ","उफ़ताद":"افتاد","ख़ुदा-ना-ख़्वास्ता":"خدا نہ خواستہ","सीना":"سینہ","बिल-आख़िर":"بالآخر","हैराँ":"حیراں","तंज़िया":"تنزیہ","नदामत":"ندامت","फ़ौरन":"فوراً","बस्ता":"بستہ","लापरवा":"لاپروا","सलामत":"سلامت","उमीदें":"امیدیں","अरमान":"ارمان","कमज़ोरी":"کمزوری","बख़्शिश":"بخشش","आख़िरत":"آخرت","बे-सबब":"بے سبب","बिछड़ना":"بچھڑنا","लाइक़":"لائق","ग़लत":"غلط","मा'ज़रत":"معذرت","पाक":"پاک","ज़ाहिर":"ظاہر","बातिन":"باطن","तनक़ीद":"تنقید","मायूस":"مایوس","असलियत":"اصلیت","फ़ितरतन":"فطرتاً","माने":"مانے","अ'ज़ाब":"عذاب","'आफ़ियत":"عافیت","बाँटने":"بانٹنے","मुतमइन":"مطمئن","कैफ़ियत":"کیفیت","आग़ाज़":"آغاز","अन-गिनत":"ان گنت","लाइक़-ए-बख़्शिश":"لائقِ بخشش","सँवरेगी":"سنورے گی","काविशें":"کاوشیں","चाह":"چاہ","'ज़ान'":"زاں","चेहरा":"چہرہ","चेहरे":"چہرے","चेहरों":"چہروں","हिम्मत":"ہمت","मुख़ातब":"مخاطب","आइने":"آئینے","सहमत":"متفق","मुहतरम":"محترم","बेहतरीन":"بہترین","इज़्ज़त":"عزت","तवज्जोह":"توجہ","तसव्वुर":"تصور","दिक्कत":"دقت","बच्चा":"بچہ","मुअज़्ज़िन":"مؤذن","सय्याद":"صیاد","हिस्सा":"حصہ","ग़ुस्सा":"غصہ","गुस्सा":"غصہ","ज़िम्मेदारी":"ذمہ داری","ताज़ा":"تازہ","ज़िंदा":"زندہ","सुब्ह":"صبح","मुंतज़िर":"منتظر","इज़ाफ़ा":"اضافہ","औरत":"عورت","हक़":"حق","ए'तिमाद":"اعتماد","वस्फ़":"وصف","रब्त":"ربط","नज़रों":"نظروں","ग़रज़":"غرض","बिल":"بال","मिसाल":"مثال","एहसान":"احسان","फरहाद":"فرہاد","जज़्बा":"جذبہ","अज़ीज़":"عزیز","अहद":"عہد","लज़्ज़त":"لذت","हराम":"حرام","हक़ीक़त":"حقیقت","हालत":"حالت","ज़िक्र":"ذکر","ज़ुल्म":"ظلم","ज़ुल्मत":"ظلمت","मंज़र":"منظر","मुसीबत":"مصیبت","सब्र":"صبر","साबिर":"صابر","नुक़्स":"نقص","नुक़सान":"نقصان","रुख़्सती":"رخصتی","क़ाबिज़":"قابض","फ़ज़ीहत":"فضیحت","हसरत":"حسرت","हसरतें":"حسرتیں","हसरतों":"حسرتوں","वहशत":"وحشت","हश्र":"حشر","तवील":"طویل","शर्त":"شرط","तौर":"طور","मतलब":"مطلب","फ़ितरत":"فطرت","लुत्फ़":"لطف","नसीब":"نصیب","तरफ़":"طرف","माज़ी":"ماضی","मासूम":"معصوم","एहतियात":"احتیاط","नाराज़गी":"ناراضگی","हौसला":"حوصلہ","हुलिये":"حلیے","वाजेह":"واضح","मौज़ू'":"موضوع","सलीब":"صلیب","'अज़ाब":"عذاب","एतिमाद":"اعتماد","शा'इरी":"شاعری","वादा":"وعدہ","वा'दा":"وعدہ","मसअला":"مسئلہ","मस'अले":"مسئلے","दूँगा":"دوں گا","रहेगी":"رہے گی","जाएगा":"جائے گا","लेगा":"لے گا","निभाएँगे":"نبھائیں گے","आएगी":"آئے گی","लूँगा":"لوں گا","मिलेंगे":"ملیں گے","दिखेगी":"دکھے گی","जाऊँगा":"جاؤں گا","लेगी":"لے گی","करेंगे":"کریں گے","समझेगा":"سمجھے گا","देगा":"دے گا","हमेशा":"ہمیشہ","फ़ातेह":"فاتح","एहसाँ":"احساں","जियूँगा":"جیوں گا","पाँव":"پاؤں","मैंने":"میں نے","देंगे":"دیں گے","वादे":"وعدے","वा'दे":"وعدے","वा'दों":"وعدوں","मासूमियत":"معصومیت","साफ़":"صاف","हस्सास":"حساس","एहतियाती":"احتیاطی","अफ़सुर्दा":"افسردہ","उम्र":"عمر","ज़ियादा":"زیادہ","महफ़ूज़":"محفوظ","लम्हें":"لمحیں","तहती":"تحتی","मौजूदा":"موجودہ","गिर्या":"گریہ","नुक़्सान":"نقصان","क़सरत":"کثرت","नज़रिये":"نظریے","नज़रिया":"نظریہ","ज़ात":"ذات","वास्ते":"واسطے","मंजर":"منظر","सोचेंगे":"سوچیں گے","सोचोगे":"سوچو گے","गुज़रेंगे":"گزریں گے","आएँगें":"آئیں گے","बोलेंगे":"بولیں گے","देखेंगे":"دیکھیں گے","जाएगी":"جائے گی","जाएँगे":"جائیں گے","पाएँगे":"پائیں گے","पाएँगी":"پائیں گی","समझेंगे":"سمجھیں گے","बनूँगा":"بنوں گا","छोड़ूँगा":"چھوڑوں گا"};

  /* Devanagari nuqta letters (क़ ख़ ग़ ज़ ड़ ढ़ फ़ ...) can arrive as either
     one precomposed codepoint or a base letter + combining nuqta (U+093C).
     The source data mixes both depending on where each poem was typed/
     pasted from. NFD normalisation always expands to the 2-character form,
     so normalising both the dictionary keys and every string we look up
     guarantees they compare equal regardless of which form was typed. */
  var ZF_UR_WORDS = {};
  for(var _k in ZF_UR_WORDS_RAW){
    if(ZF_UR_WORDS_RAW.hasOwnProperty(_k)) ZF_UR_WORDS[_k.normalize('NFD')] = ZF_UR_WORDS_RAW[_k];
  }

  /* ---- character-level fallback tables ---- */
  var NUQTA = '\u093c';
  var VIRAMA = '\u094d';

  var CONSONANTS = {
    'क':'ک','ख':'کھ','ग':'گ','घ':'گھ','ङ':'ن',
    'च':'چ','छ':'چھ','ज':'ج','झ':'جھ','ञ':'ن',
    'ट':'ٹ','ठ':'ٹھ','ड':'ڈ','ढ':'ڈھ','ण':'ن',
    'त':'ت','थ':'تھ','द':'د','ध':'دھ','न':'ن',
    'प':'پ','फ':'پھ','ब':'ب','भ':'بھ','म':'م',
    'य':'ی','र':'ر','ल':'ل','व':'و',
    'श':'ش','ष':'ش','स':'س','ह':'ہ','ळ':'ل'
  };
  var NUQTA_CONSONANTS = {
    'क':'ق','ख':'خ','ग':'غ','ज':'ز','ड':'ڑ','ढ':'ڑھ','फ':'ف','य':'ے'
  };
  var MATRAS = {
    '\u093e':'ا', '\u093f':'', '\u0940':'ی', '\u0941':'', '\u0942':'و',
    '\u0947':'ے', '\u0948':'ے', '\u094b':'و', '\u094c':'و',
    '\u0943':'ر', '\u0949':'و'
  };
  var INDEP_VOWELS = {
    'अ':'ا','आ':'آ','इ':'ا','ई':'ای','उ':'ا','ऊ':'او',
    'ऋ':'ر','ए':'اے','ऐ':'اے','ओ':'او','औ':'او'
  };
  /* When an independent vowel follows ANOTHER vowel sound (a matra, or
     another independent vowel) rather than starting a fresh syllable —
     e.g. दिखाई, आज़माए, माइल, बताऊँ — Urdu bridges that hiatus with hamza
     instead of stacking plain alifs (بھلائی, آزمائے, مائل, بتاؤں), which is
     the standard spelling for this very common verb/gerund ending. */
  var HIATUS_VOWELS = {
    'इ':'\u0626', 'ई':'\u0626\u06cc', 'उ':'\u0624', 'ऊ':'\u0624',
    'ए':'\u0626\u06d2', 'ऐ':'\u0626\u06d2', 'ओ':'\u0624', 'औ':'\u0624'
  };
  /* ऐन (ع, written as an apostrophe in the source) behaves like a normal
     consonant that TAKES the following vowel the way any consonant takes
     a matra — 'आफ़ियत -> عافیت, 'इश्क़ -> عشق, 'उम्र -> عمر — not like an
     independent vowel needing a hiatus bridge. Same value shape as MATRAS,
     just keyed by the independent-vowel character since that's how the
     source spells a vowel with no consonant in front of it to attach to. */
  var AIN_VOWEL_MAP = {
    'अ':'', 'आ':'ا', 'इ':'', 'ई':'\u06cc', 'उ':'', 'ऊ':'\u0648',
    'ए':'\u06d2', 'ऐ':'\u06d2', 'ओ':'\u0648', 'औ':'\u0648'
  };
  var NASAL = { '\u0902':'\u06ba', '\u0901':'\u06ba' }; // ं ँ -> ں

  /* बड़ी ی (choti ye, U+06CC) बनाम बड़ी ے (badi ye, U+06D2): Urdu spells the
     े/ऐ "e/ai" vowel with badi ye ONLY when it is the last letter of the
     word (है -> ہے, चैन -> چین's final न carries no matra so ऐ IS last,
     देखे -> دیکھے's final े) — everywhere else, mid-word, it's choti ye
     (देखे's FIRST े -> دیکھے, कैसा -> کیسا, हमेशा -> ہمیشہ). Same choti/badi
     split applies to independent ए/ऐ (एक -> ایک vs ऐ! -> اے!) and to the
     hamza-bridged hiatus form (आएगी's आए -> آئے because गी is a separate
     word, but आएगा-without-space would need آئی if fused). These helpers
     centralise that one positional rule so every table lookup below stays
     consistent instead of hardcoding badi ye and getting mid-word cases
     wrong (this was the exact bug behind देखे wrongly becoming دے کھے). */
  var CHOTI_YE = '\u06cc', BADI_YE = '\u06d2';
  function matraOutput(ch, isFinal){
    if(ch === '\u0947' || ch === '\u0948') return isFinal ? BADI_YE : CHOTI_YE;
    return MATRAS[ch];
  }
  function indepVowelOutput(ch, isFinal){
    if(ch === '\u090f' || ch === '\u0910') return '\u0627' + (isFinal ? BADI_YE : CHOTI_YE);
    return INDEP_VOWELS[ch];
  }
  function hiatusVowelOutput(ch, isFinal){
    if(ch === '\u090f' || ch === '\u0910') return '\u0626' + (isFinal ? BADI_YE : CHOTI_YE);
    return HIATUS_VOWELS[ch];
  }
  function ainVowelOutput(ch, isFinal){
    if(ch === '\u090f' || ch === '\u0910') return isFinal ? BADI_YE : CHOTI_YE;
    return AIN_VOWEL_MAP[ch];
  }

  function transliterateChars(word){
    var out = '';
    var i = 0, n = word.length;
    /* tracks whether the output emitted so far ends in an open vowel sound
       (an explicit matra, a bare consonant's inherent 'a', or a previous
       independent vowel) — that's exactly when a following independent
       vowel is in hiatus and needs a hamza bridge rather than a plain alif */
    var prevVowelEnd = false;
    var afterAin = false;
    while(i < n){
      var ch = word[i];
      if(ch === "'" || ch === '\u2018' || ch === '\u2019'){
        out += '\u0639'; i++; afterAin = true; prevVowelEnd = false; continue;
      }
      if(INDEP_VOWELS[ch]){
        /* नासalised ए/ऐ ending (जाएँ, निभाएँगे) — same یں convention as the
           consonant+matra case below, just for the independent-vowel form */
        if((ch === '\u090f' || ch === '\u0910') &&
           (word[i+1] === '\u0902' || word[i+1] === '\u0901') && i + 2 === n){
          out += (afterAin ? '' : (prevVowelEnd ? '\u0626' : '')) + '\u06cc\u06ba';
          i += 2; afterAin = false; prevVowelEnd = false; continue;
        }
        var vowelIsFinal = (i === n - 1);
        if(afterAin){
          out += ainVowelOutput(ch, vowelIsFinal);
        }else{
          out += (prevVowelEnd && HIATUS_VOWELS.hasOwnProperty(ch)) ? hiatusVowelOutput(ch, vowelIsFinal) : indepVowelOutput(ch, vowelIsFinal);
        }
        i++; afterAin = false; prevVowelEnd = true; continue;
      }
      afterAin = false;
      /* A nasal mark (ं anusvara or ँ chandrabindu) immediately before
         another consonant is a homorganic nasal STOP (अंदर, मंज़िल, संग,
         ज़िंदा, आँख -> آنکھ, माँगना -> مانگنا), so it's a plain ن — the ں
         (noon-ghunna) reading is reserved for nasalising a word-FINAL
         vowel (जहाँ -> جہاں, कहाँ -> کہاں, करूँ(गा) -> کروں). */
      if((ch === '\u0902' || ch === '\u0901') && CONSONANTS[word[i+1]]){
        out += '\u0646'; i++; prevVowelEnd = false; continue;
      }
      if(NASAL[ch]){ out += NASAL[ch]; i++; prevVowelEnd = false; continue; }
      if(CONSONANTS[ch]){
        var base = ch;
        i++;
        var hasNuqta = (word[i] === NUQTA);
        if(hasNuqta) i++;
        var mapped = hasNuqta ? (NUQTA_CONSONANTS[base] || CONSONANTS[base]) : CONSONANTS[base];
        /* true gemination (X + halant + same X, e.g. मोहब्बत, हिम्मत, मुद्दत) —
           standard Urdu writing drops the shadda and spells it with a
           single letter (محبت، ہمت، مدت), so collapse the repeat instead
           of emitting the consonant twice. */
        if(word[i] === VIRAMA && word[i+1] === base &&
           ((word[i+2] === NUQTA) === hasNuqta)){
          i += hasNuqta ? 3 : 2; // skip halant + repeated base (+ its nuqta)
          if((word[i] === '\u0940' || word[i] === '\u0947' || word[i] === '\u0948') &&
             (word[i+1] === '\u0902' || word[i+1] === '\u0901') && i + 2 === n){
            out += mapped + '\u06cc\u06ba';
            i += 2; prevVowelEnd = false; continue;
          }
          if(MATRAS.hasOwnProperty(word[i])){
            out += mapped + matraOutput(word[i], i === n - 1);
            i++; prevVowelEnd = true; continue;
          }
          out += mapped; // bare, inherent 'a' on the (single) collapsed letter
          prevVowelEnd = true;
          continue;
        }
        if(word[i] === VIRAMA){
          out += mapped;
          i++; // skip virama, no vowel letter, next consonant joins directly
          prevVowelEnd = false;
          continue;
        }
        /* word-final nasalised ी/े/ै (common plural/feminine ending, e.g.
           चीज़ें, महिलाएँ, हैं) conventionally spells as یں, not matra+ں —
           but ONLY when it's truly the word's last two characters; ं/ँ
           mid-word before a further consonant (खींचूँ, देंगे) is not this
           pattern and must fall through to ordinary matra/nasal handling. */
        if((word[i] === '\u0940' || word[i] === '\u0947' || word[i] === '\u0948') &&
           (word[i+1] === '\u0902' || word[i+1] === '\u0901') && i + 2 === n){
          out += mapped + '\u06cc\u06ba';
          i += 2;
          prevVowelEnd = false;
          continue;
        }
        if(MATRAS.hasOwnProperty(word[i])){
          out += mapped + matraOutput(word[i], i === n - 1);
          i++;
          prevVowelEnd = true;
          continue;
        }
        /* bare consonant — Devanagari's inherent 'a' is itself an open
           vowel sound, so a following independent vowel is in hiatus too */
        out += mapped;
        prevVowelEnd = true;
        continue;
      }
      /* punctuation, digits, spaces, Latin chars pass through unchanged */
      out += ch;
      i++;
      prevVowelEnd = false;
    }
    return out;
  }

  function transliterateWord(word){
    if(!word) return word;
    if(ZF_UR_WORDS.hasOwnProperty(word)) return ZF_UR_WORDS[word];
    var bare = word.replace(/^[.,;:!?()\u2018\u2019"]+|[.,;:!?()\u2018\u2019"]+$/g, '');
    if(bare && ZF_UR_WORDS.hasOwnProperty(bare)){
      return word.replace(bare, ZF_UR_WORDS[bare]);
    }
    return transliterateChars(word);
  }

  /* इज़ाफ़त (اضافت) — "-ए-" joining two words, e.g. राह-ए-ख़ुदा — is NOT
     written as word + اے + word in Urdu. The connecting "e" is a zer
     (ِ) attached directly to the end of the first word: راہِ خدا. Chains
     (word-ए-word-ए-word) take a zer after every word but the last one.
     वाव-ए-अत्फ़ (واوِ عطف) — "-ओ-" joining two words, e.g. दिल-ओ-जाँ —
     is the connector و standing as its own word: دل و جاں. */
  var ZER = '\u0650';
  function transliterateIzafatChain(text){
    return text.replace(
      /([\u0900-\u097F\u2018\u2019']+)((?:-[एओ]-[\u0900-\u097F\u2018\u2019']+)+)/g,
      function(full, firstWord, chain){
        var out = transliterateWord(firstWord);
        var linkRe = /-([एओ])-([\u0900-\u097F\u2018\u2019']+)/g;
        var m;
        while((m = linkRe.exec(chain))){
          var connector = m[1], nextWord = transliterateWord(m[2]);
          out += (connector === 'ए') ? (ZER + ' ' + nextWord) : (' \u0648 ' + nextWord);
        }
        return out;
      }
    );
  }

  /* split on Devanagari word boundaries, keep separators (spaces, hyphens
     joining compound poetic words, punctuation) intact */
  function transliterateLine(text){
    if(!text) return text;
    /* normalise once up front — see the NFD note above ZF_UR_WORDS */
    text = text.normalize('NFD');
    text = transliterateIzafatChain(text);
    text = text.replace(/[\u0900-\u097F\u2018\u2019']+/g, function(devWord){
      return transliterateWord(devWord);
    });
    /* any hyphen still standing between two already-transliterated Urdu
       words is a leftover joiner from a nested compound the izafat pass
       didn't fully absorb (e.g. the बे-मिसाल half of हुस्न-ए-बे-मिसाल) —
       a space reads correctly there instead of a stray Latin hyphen */
    text = text.replace(/([\u0600-\u06FF])-([\u0600-\u06FF])/g, '$1 $2');
    return text;
  }

  /* Transliterate a Devanagari HTML fragment (verses come wrapped in
     <div class="verse">...<span class="line">...</span>...</div>) —
     walk text nodes only, leave tags untouched. */
  function transliterateHtml(html){
    return html.replace(/(<[^>]*>)|([^<]+)/g, function(full, tag, text){
      if(tag) return tag;
      return transliterateLine(text);
    });
  }

  window.ZF_UR_transliterateText = transliterateLine;
  window.ZF_UR_transliterateHtml = transliterateHtml;

})();
