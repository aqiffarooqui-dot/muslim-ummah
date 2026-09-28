package com.aqiffarooqui.muslimummah;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.Settings;
import android.view.Gravity;
import android.widget.*;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import java.util.List;

import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class MainActivity extends Activity {
    private static final String UPDATE_URL="https://aqiffarooqui-dot.github.io/muslim-ummah/update.json";
    private static final String CURRENT_VERSION="1.0.3";
    private LinearLayout content;
    private TextView title;
    private final int green=Color.rgb(22,163,74);
    private long downloadId=-1L;
    private BroadcastReceiver downloadReceiver;

    @Override public void onCreate(Bundle state){super.onCreate(state);buildApp();loadHadithBookmarks();registerDownloadReceiver();checkForUpdate();}

    private void buildApp(){
        LinearLayout root=new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setBackgroundColor(Color.rgb(248,250,248));
        title=text("Muslim Ummah",28,Color.rgb(20,24,20),true); title.setPadding(24,26,24,8); root.addView(title,new LinearLayout.LayoutParams(-1,-2));
        content=new LinearLayout(this); content.setOrientation(LinearLayout.VERTICAL);
        ScrollView scroll=new ScrollView(this); scroll.setFillViewport(true); scroll.addView(content); root.addView(scroll,new LinearLayout.LayoutParams(-1,0,1));
        LinearLayout nav=new LinearLayout(this); nav.setGravity(Gravity.CENTER); nav.setBackgroundColor(Color.WHITE);
        String[] labels={"Home","Quran","Hadith","Prayer","Profile"};
        for(int i=0;i<labels.length;i++){final int tab=i;TextView b=text(labels[i],13,Color.DKGRAY,false);b.setGravity(Gravity.CENTER);b.setPadding(4,18,4,18);b.setOnClickListener(v->showTab(tab));nav.addView(b,new LinearLayout.LayoutParams(0,-2,1));}
        root.addView(nav);setContentView(root);showTab(0);
    }
    private void showTab(int tab){content.removeAllViews();if(tab==0)showHome();else if(tab==1)showQuran();else if(tab==2)showHadith();else if(tab==3)showPrayer();else showProfile();}
    private void showHome(){
        title.setText("Assalamu Alaikum");
        addSection("Muslim Ummah","Your daily Qur'an, Hadith & worship companion");

        LinearLayout reminder=card();
        reminder.addView(text("TODAY'S REMINDER",12,green,true));
        reminder.addView(text("“Indeed, in the remembrance of Allah do hearts find rest.”",19,Color.rgb(20,24,20),true));
        reminder.addView(text("Qur'an 13:28",13,Color.GRAY,false));
        Button openReminder=new Button(this); openReminder.setText("Read Qur'an"); openReminder.setAllCaps(false);
        openReminder.setOnClickListener(v->showQuran()); reminder.addView(openReminder);
        content.addView(reminder);

        LinearLayout continueCard=card();
        continueCard.addView(text("CONTINUE READING",12,green,true));
        String progress=getPreferences(MODE_PRIVATE).getString("quran_progress","");
        continueCard.addView(text(progress.isEmpty()?"Start your Qur'an journey":"Continue from your saved Ayah",18,Color.rgb(20,24,20),true));
        continueCard.addView(text(progress.isEmpty()?"114 Surahs available offline":"Your reading progress is saved on this device",13,Color.GRAY,false));
        Button q=new Button(this); q.setText(progress.isEmpty()?"Open Qur'an":"Continue"); q.setAllCaps(false); q.setOnClickListener(v->showQuran()); continueCard.addView(q);
        content.addView(continueCard);

        LinearLayout quick=card();
        quick.addView(text("QUICK ACCESS",12,green,true));
        addQuickButton(quick,"📖  Qur'an","114 Surahs • Offline reading",()->showQuran());
        addQuickButton(quick,"📚  Hadith","9 books • Chapters • Search",()->showHadith());
        addQuickButton(quick,"🕌  Prayer","Prayer times • Qibla",()->showPrayer());
        content.addView(quick);

        LinearLayout premium=card();
        premium.addView(text(PremiumManager.isPremium(this)?"PREMIUM ACTIVE":"MUSLIM UMMAH PREMIUM",12,green,true));
        premium.addView(text(PremiumManager.isPremium(this)?"Premium features are unlocked":"Translations, Tafsir, audio, advanced tools & more",17,Color.rgb(20,24,20),true));
        Button p=new Button(this); p.setText(PremiumManager.isPremium(this)?"View Premium":"Explore Premium"); p.setAllCaps(false); p.setOnClickListener(v->showPremiumFeatures()); premium.addView(p);
        content.addView(premium);
    }

    private void addQuickButton(LinearLayout parent,String heading,String sub,Runnable action){
        LinearLayout row=new LinearLayout(this); row.setGravity(Gravity.CENTER_VERTICAL); row.setPadding(4,10,4,10);
        LinearLayout labels=new LinearLayout(this); labels.setOrientation(LinearLayout.VERTICAL);
        labels.addView(text(heading,16,Color.rgb(20,24,20),true));
        labels.addView(text(sub,12,Color.GRAY,false));
        row.addView(labels,new LinearLayout.LayoutParams(0,-2,1));
        TextView arrow=text("›",26,green,true); row.addView(arrow);
        row.setOnClickListener(v->action.run()); parent.addView(row);
    }

    private void showQuran(){
        title.setText("Qur'an");
        addSection("Qur'an Reader","114 Surahs • Arabic • translations • bookmarks • progress");
        Button advanced=new Button(this); advanced.setText("Premium • Advanced Qur'an Search"); advanced.setAllCaps(false); advanced.setOnClickListener(v->showAdvancedQuranSearch()); content.addView(advanced,new LinearLayout.LayoutParams(-1,-2));
        EditText search=new EditText(this); search.setHint("Search Surah"); search.setSingleLine(true); search.setPadding(22,12,22,12); content.addView(search,new LinearLayout.LayoutParams(-1,-2));
        LinearLayout list=new LinearLayout(this); list.setOrientation(LinearLayout.VERTICAL); content.addView(list,new LinearLayout.LayoutParams(-1,-2));
        Runnable render=()->{ list.removeAllViews(); String q=search.getText().toString().trim().toLowerCase(); for(QuranData.Surah x:QuranData.SURAHS){ if(q.length()>0 && !(x.name.toLowerCase().contains(q)||x.englishName.toLowerCase().contains(q)||x.arabicName.contains(q)||String.valueOf(x.number).equals(q))) continue; addSurahRow(list,x); } };
        search.addTextChangedListener(new android.text.TextWatcher(){public void beforeTextChanged(CharSequence s,int a,int b,int c){} public void onTextChanged(CharSequence s,int a,int b,int c){render.run();} public void afterTextChanged(android.text.Editable e){}});
        render.run();
    }
    private void addSurahRow(LinearLayout list,QuranData.Surah x){
        LinearLayout c=card(); c.setOnClickListener(v->showSurah(x));
        LinearLayout row=new LinearLayout(this); row.setGravity(Gravity.CENTER_VERTICAL);
        TextView num=text(String.valueOf(x.number),15,green,true); num.setGravity(Gravity.CENTER); row.addView(num,new LinearLayout.LayoutParams(48,48));
        LinearLayout labels=new LinearLayout(this); labels.setOrientation(LinearLayout.VERTICAL); labels.setPadding(12,0,8,0);
        labels.addView(text(x.name+" • "+x.arabicName,17,Color.rgb(20,24,20),true));
        labels.addView(text(x.englishName+" • "+x.revelation+" • "+x.ayahCount+" Ayahs",13,Color.GRAY,false));
        row.addView(labels,new LinearLayout.LayoutParams(0,-2,1)); row.addView(text("›",28,green,false)); c.addView(row); list.addView(c);
    }
    private void showAdvancedQuranSearch(){
        if(!PremiumManager.isFeatureUnlocked(this,PremiumFeatures.ADVANCED_QURAN_SEARCH)){ showPremiumRequired("Advanced Qur'an search"); return; }
        content.removeAllViews(); title.setText("Advanced Qur'an Search");
        addSection("Search the Qur'an","Search bundled English translation across all 114 Surahs.");
        EditText q=new EditText(this); q.setHint("Search words, topics or phrases"); q.setSingleLine(true); content.addView(q,new LinearLayout.LayoutParams(-1,-2));
        Button go=new Button(this); go.setText("Search"); go.setAllCaps(false); content.addView(go,new LinearLayout.LayoutParams(-1,-2));
        LinearLayout results=new LinearLayout(this); results.setOrientation(LinearLayout.VERTICAL); content.addView(results);
        go.setOnClickListener(goView->{
            String query=q.getText().toString().trim().toLowerCase(java.util.Locale.ROOT);
            results.removeAllViews();
            if(query.length()<2){results.addView(text("Enter at least 2 characters.",14,Color.GRAY,false));return;}
            results.addView(text("Searching bundled Qur'an…",14,Color.GRAY,false));
            new Thread(()->{
                java.util.List<QuranNativeData.Ayah> matches=new java.util.ArrayList<>();
                for(QuranData.Surah s:QuranData.SURAHS){
                    final Object lock=new Object(); final boolean[] done={false};
                    QuranNativeData.load(this,s.number,"english",(a,e)->{if(e==null)for(QuranNativeData.Ayah x:a)if(x.text.toLowerCase(java.util.Locale.ROOT).contains(query)&&matches.size()<30)matches.add(x); synchronized(lock){done[0]=true;lock.notifyAll();}});
                    synchronized(lock){while(!done[0])try{lock.wait(3000);}catch(Exception ignored){}}
                    if(matches.size()>=30)break;
                }
                runOnUiThread(()->{
                    results.removeAllViews();
                    if(matches.isEmpty()){results.addView(text("No matching Ayah found.",15,Color.GRAY,false));return;}
                    results.addView(text(matches.size()+" result(s)",14,green,true));
                    for(QuranNativeData.Ayah a:matches){
                        LinearLayout row=card(); QuranData.Surah s=QuranData.SURAHS[a.surah-1];
                        row.addView(text(s.name+" • Ayah "+a.number,16,green,true)); row.addView(text(a.text,16,Color.rgb(20,24,20),false));
                        row.setOnClickListener(rowView->openReader(s,"english")); results.addView(row);
                    }
                });
            }).start();
        });
        TextView back=text("‹  Back to Qur'an",16,green,true); back.setPadding(22,18,22,18); back.setOnClickListener(v->showQuran()); content.addView(back);
    }

    private void showSurah(QuranData.Surah x){
        content.removeAllViews(); title.setText(x.name);
        addSection(x.arabicName+"  •  "+x.englishName,x.revelation+" • "+x.ayahCount+" Ayahs");
        addActionRow("Read Surah","Arabic • offline after first load",()->openReader(x,"arabic"));
        addActionRow("Translations","Premium • Hindi/English/Urdu/Hinglish",()->openPremiumTranslationReader(x));
        addActionRow("Bookmark","Open saved Ayah",()->openBookmarked(x));
        TextView back=text("‹  Back to Surahs",16,green,true); back.setPadding(22,18,22,18); back.setOnClickListener(v->showQuran()); content.addView(back);
    }
    private void addActionRow(String h,String body,final Runnable action){
        LinearLayout c=card(); c.setOnClickListener(v->action.run());
        LinearLayout row=new LinearLayout(this); row.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout labels=new LinearLayout(this); labels.setOrientation(LinearLayout.VERTICAL);
        labels.addView(text(h,17,Color.rgb(20,24,20),true)); labels.addView(text(body,13,Color.GRAY,false));
        row.addView(labels,new LinearLayout.LayoutParams(0,-2,1)); row.addView(text("›",28,green,false)); c.addView(row); content.addView(c);
    }
    private void openPremiumTranslationReader(QuranData.Surah x){
        if(!PremiumManager.isFeatureUnlocked(this,PremiumFeatures.TRANSLATIONS)){
            showPremiumRequired("Qur'an translations");
            return;
        }
        openReader(x,"english");
    }

    private void showPremiumRequired(String feature){
        new AlertDialog.Builder(this)
                .setTitle("Premium Feature")
                .setMessage(feature+" is available with Premium. Your free Arabic reading remains available offline.")
                .setPositiveButton("OK",null)
                .show();
    }

    private void openReader(QuranData.Surah x,String lang){
        content.removeAllViews(); title.setText(x.name+" • "+(lang.equals("arabic")?"Arabic":"Translation"));
        LinearLayout controls=new LinearLayout(this); controls.setGravity(Gravity.CENTER_VERTICAL);
        Spinner spinner=new Spinner(this);
        String[] langs={"Arabic","English","Urdu","Hinglish"}; ArrayAdapter<String> adapter=new ArrayAdapter<>(this,android.R.layout.simple_spinner_dropdown_item,langs); spinner.setAdapter(adapter);
        if(lang.equals("urdu"))spinner.setSelection(2); else if(lang.equals("hinglish"))spinner.setSelection(3); else if(lang.equals("english"))spinner.setSelection(1);
        controls.addView(spinner,new LinearLayout.LayoutParams(0,-2,1));
        Button bookmark=new Button(this); bookmark.setText("Bookmarks"); bookmark.setAllCaps(false); controls.addView(bookmark,new LinearLayout.LayoutParams(-2,-2)); content.addView(controls);
        TextView status=text("Loading Qur'an…",15,Color.GRAY,false); status.setPadding(22,16,22,16); content.addView(status);
        LinearLayout list=new LinearLayout(this); list.setOrientation(LinearLayout.VERTICAL); content.addView(list);
        Runnable[] load={null};
        load[0]=()->{
            String selected=spinner.getSelectedItem().toString();
            String key=selected.equals("Urdu")?"urdu":selected.equals("Hinglish")?"hinglish":selected.equals("English")?"english":"arabic";
            title.setText(x.name+" • "+selected); status.setText("Loading…");
            list.removeAllViews();
            QuranNativeData.load(this,x.number,key,(ayahs,error)->runOnUiThread(()->{
                if(error!=null){status.setText("Unable to load this Surah. Internet is required once, then it works offline.");return;}
                status.setText(ayahs.size()+" Ayahs • cached for offline reading");
                for(QuranNativeData.Ayah a:ayahs) addAyahCard(list,x,a,key);
            }));
        };
        spinner.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener(){public void onNothingSelected(android.widget.AdapterView<?> p){} public void onItemSelected(android.widget.AdapterView<?> p,android.view.View v,int pos,long id){load[0].run();}});
        bookmark.setOnClickListener(v->openBookmarked(x));
        TextView back=text("‹  Back to Surah",16,green,true); back.setPadding(22,18,22,18); back.setOnClickListener(v->showSurah(x)); content.addView(back);
    }
    private void addAyahCard(LinearLayout list,QuranData.Surah x,QuranNativeData.Ayah a,String lang){
        LinearLayout c=card();
        TextView n=text("Ayah "+a.number,13,green,true); c.addView(n);
        TextView body=text(a.text,lang.equals("arabic")?25:17,Color.rgb(20,24,20),false);
        if(lang.equals("arabic")) body.setGravity(Gravity.RIGHT); body.setTextIsSelectable(true); body.setPadding(4,12,4,12); c.addView(body);
        Button b=new Button(this); b.setText(isBookmarked(x.number,a.number)?"★ Bookmarked":"☆ Bookmark"); b.setAllCaps(false); b.setOnClickListener(v->{toggleBookmark(x.number,a.number);b.setText(isBookmarked(x.number,a.number)?"★ Bookmarked":"☆ Bookmark");}); c.addView(b);
        c.setOnClickListener(v->getPreferences(MODE_PRIVATE).edit().putString("quran_progress",x.number+":"+a.number).apply());
        list.addView(c);
    }
    private void toggleBookmark(int s,int a){String k="quran_bookmark_"+s+"_"+a;android.content.SharedPreferences p=getPreferences(MODE_PRIVATE);p.edit().putBoolean(k,!p.getBoolean(k,false)).apply();}
    private boolean isBookmarked(int s,int a){return getPreferences(MODE_PRIVATE).getBoolean("quran_bookmark_"+s+"_"+a,false);}
    private void openBookmarked(QuranData.Surah x){
        for(int i=1;i<=x.ayahCount;i++) if(isBookmarked(x.number,i)){openReader(x,"arabic");return;}
        new AlertDialog.Builder(this).setTitle("No bookmark").setMessage("No saved Ayah in "+x.name+" yet.").setPositiveButton("OK",null).show();
    }
    private static final String HADITH_BASE="https://raw.githubusercontent.com/AhmedBaset/hadith-json/v1.2.0/db/by_chapter/the_9_books";
    private static final String HADITH_FA="https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions";
    private static final String HADITH_TOON="https://cdn.jsdelivr.net/gh/HsnSaboor/hadith-api-toon@main/editions";
    private int hadithBookIndex=0;
    private String hadithChapterId="";
    private String hadithLanguage="english";
    private final java.util.Map<String,java.util.List<HadithItem>> hadithCache=new java.util.HashMap<>();
    private final java.util.Map<Integer,String> hadithUrdu=new java.util.HashMap<>();
    private final java.util.Map<Integer,String> hadithHindi=new java.util.HashMap<>();
    private final java.util.Map<Integer,String> hadithRoman=new java.util.HashMap<>();
    private final java.util.Set<String> hadithBookmarks=new java.util.HashSet<>();

    private static final class HadithBook{
        final String id,name,shortName,edition;
        final String[] chapters;
        HadithBook(String id,String name,String shortName,String[] chapters,String edition){
            this.id=id;this.name=name;this.shortName=shortName;this.chapters=chapters;this.edition=edition;
        }
    }
    private static final class HadithItem{
        int number; String arabic="",english="",chapter="";
        HadithItem(int n,String a,String e,String c){number=n;arabic=a;english=e;chapter=c;}
    }

    private static String[] seq(int from,int to){
        String[] out=new String[to-from+1];
        for(int i=from;i<=to;i++)out[i-from]=String.valueOf(i);
        return out;
    }
    private static String[] introSeq(int to){
        String[] out=new String[to+1];
        out[0]="introduction";
        for(int i=1;i<=to;i++)out[i]=String.valueOf(i);
        return out;
    }
    private static String[] nasaiChapters(){
        String[] out=new String[52];
        int p=0;
        for(int i=1;i<=34;i++)out[p++]=String.valueOf(i);
        out[p++]="35"; out[p++]="35b";
        for(int i=36;i<=51;i++)out[p++]=String.valueOf(i);
        return out;
    }

    private static final HadithBook[] HADITH_BOOKS={
        new HadithBook("bukhari","Sahih al-Bukhari","Bukhari",seq(1,97),"eng-bukhari"),
        new HadithBook("muslim","Sahih Muslim","Muslim",introSeq(56),"eng-muslim"),
        new HadithBook("abudawud","Sunan Abi Dawud","Abu Dawud",seq(1,43),"eng-abudawud"),
        new HadithBook("tirmidhi","Jami at-Tirmidhi","Tirmidhi",seq(1,49),"eng-tirmidhi"),
        new HadithBook("nasai","Sunan an-Nasa'i","Nasa'i",nasaiChapters(),"eng-nasai"),
        new HadithBook("ibnmajah","Sunan Ibn Majah","Ibn Majah",introSeq(37),"eng-ibnmajah"),
        new HadithBook("malik","Muwatta Malik","Malik",seq(1,61),"eng-malik"),
        new HadithBook("ahmad","Musnad Ahmad","Ahmad",new String[]{"1","2","3","4","5","6","7","31"},"eng-ahmad"),
        new HadithBook("darimi","Sunan al-Darimi","Darimi",introSeq(23),"eng-darimi")
    };

    private void showHadith(){
        title.setText("Hadith");
        LinearLayout top=card();
        top.addView(text("Hadith Library",21,Color.rgb(20,24,20),true));
        top.addView(text("Books → Chapters → Hadiths • Search • Bookmarks",14,Color.DKGRAY,false));
        Button search=new Button(this); search.setText("Search Hadith"); search.setAllCaps(false);
        search.setOnClickListener(v->showHadithSearch()); top.addView(search); content.addView(top);
        for(int i=0;i<HADITH_BOOKS.length;i++){
            final int index=i; HadithBook b=HADITH_BOOKS[i];
            LinearLayout c=card(); c.setOrientation(LinearLayout.HORIZONTAL); c.setOnClickListener(v->openHadithBook(index));
            ImageView cover=new ImageView(this); cover.setScaleType(ImageView.ScaleType.CENTER_CROP);
            cover.setImageResource(android.R.drawable.ic_menu_gallery);
            LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(92,132); cp.setMargins(0,0,16,0); c.addView(cover,cp);
            LinearLayout info=new LinearLayout(this); info.setOrientation(LinearLayout.VERTICAL); info.setGravity(Gravity.CENTER_VERTICAL);
            info.addView(text(b.name,18,Color.rgb(20,24,20),true));
            info.addView(text(b.chapters.length+" Chapters • Arabic + English",13,Color.GRAY,false));
            info.addView(text("Open collection  ›",13,green,true)); c.addView(info,new LinearLayout.LayoutParams(0,-1,1));
            loadHadithCover(cover,index); content.addView(c);
        }
    }

    private void loadHadithCover(ImageView view,int index){
        final java.io.File cached=new java.io.File(getCacheDir(),"hadith-cover-"+index+".jpg");
        if(cached.exists()){
            Bitmap local=BitmapFactory.decodeFile(cached.getAbsolutePath());
            if(local!=null){view.setImageBitmap(local);return;}
        }
        final String[] queries={"Sahih al-Bukhari","Sahih Muslim","Sunan Abi Dawud","Jami at-Tirmidhi","Sunan an-Nasa'i","Sunan Ibn Majah","Muwatta Malik","Musnad Ahmad","Sunan al-Darimi"};
        new Thread(()->{
            try{
                String q=Uri.encode(queries[index]);
                JSONObject root=getJson("https://www.googleapis.com/books/v1/volumes?q=intitle:"+q+"&maxResults=1");
                org.json.JSONArray items=root.optJSONArray("items");
                if(items!=null&&items.length()>0){
                    JSONObject info=items.getJSONObject(0).optJSONObject("volumeInfo");
                    JSONObject images=info==null?null:info.optJSONObject("imageLinks");
                    String u=images==null?"":images.optString("thumbnail","");
                    if(!u.isEmpty()){
                        Bitmap bm=BitmapFactory.decodeStream(new URL(u.replace("http://","https://")).openStream());
                        if(bm!=null){
                            try(java.io.FileOutputStream out=new java.io.FileOutputStream(cached)){bm.compress(Bitmap.CompressFormat.JPEG,88,out);}catch(Exception ignored){}
                            runOnUiThread(()->view.setImageBitmap(bm));
                        }
                    }
                }
            }catch(Exception ignored){}
        }).start();
    }

    private void openHadithBook(int index){
        hadithBookIndex=index; hadithChapterId=""; hadithLanguage="english";
        title.setText(HADITH_BOOKS[index].name); content.removeAllViews();
        addSection(HADITH_BOOKS[index].name,HADITH_BOOKS[index].chapters.length+" chapters • Select a chapter");
        TextView search=text("⌕  Search within this collection",15,green,true);
        search.setPadding(22,18,22,18); search.setOnClickListener(v->showHadithSearch()); content.addView(search);
        for(String chapterId:HADITH_BOOKS[index].chapters){
            final String cid=chapterId;
            String label=cid.equals("introduction")?"Introduction":"Chapter "+cid;
            addActionRow(label,"Open Hadiths",()->openHadithChapter(index,cid));
        }
        TextView back=text("‹  Back to Collections",16,green,true); back.setPadding(22,18,22,18);
        back.setOnClickListener(v->showHadith()); content.addView(back);
    }

    private void openHadithChapter(int index,String chapterId){
        hadithBookIndex=index; hadithChapterId=chapterId; hadithLanguage="english";
        content.removeAllViews(); title.setText("Hadiths");
        String label=chapterId.equals("introduction")?"Introduction":"Chapter "+chapterId;
        addSection(HADITH_BOOKS[index].shortName+" • "+label,"Arabic + English + translations");
        LinearLayout languageRow=new LinearLayout(this); languageRow.setGravity(Gravity.CENTER_VERTICAL);
        String[] labels={"English","اردو","हिन्दी","Hinglish"}; String[] keys={"english","urdu","hindi","hinglish"};
        for(int i=0;i<labels.length;i++){
            final String key=keys[i]; Button btn=new Button(this); btn.setText(labels[i]); btn.setAllCaps(false);
            btn.setOnClickListener(v->{ if(!"english".equals(key) && !PremiumManager.isFeatureUnlocked(this,PremiumFeatures.HADITH_TRANSLATIONS)){showPremiumRequired("Hadith translations");return;} hadithLanguage=key;renderHadithItems(hadithReaderList,hadithReaderItems);});
            languageRow.addView(btn,new LinearLayout.LayoutParams(0,-2,1));
        }
        content.addView(languageRow);
        TextView loading=text("Loading Hadiths and translations…",14,Color.GRAY,false); loading.setPadding(22,12,22,12); content.addView(loading);
        final LinearLayout list=new LinearLayout(this); list.setOrientation(LinearLayout.VERTICAL); hadithReaderList=list;
        final java.util.List<HadithItem> items=new java.util.ArrayList<>(); hadithReaderItems=items; content.addView(list);
        new Thread(()->{
            try{
                String key=HADITH_BOOKS[index].id+"/"+chapterId+".json";
                JSONObject root=getJson(HADITH_BASE+"/"+key); org.json.JSONArray arr=root.optJSONArray("hadiths");
                if(arr!=null) for(int i=0;i<arr.length();i++){
                    JSONObject h=arr.optJSONObject(i); if(h==null)continue;
                    int n=h.optInt("idInBook",h.optInt("id",i+1));
                    JSONObject en=h.optJSONObject("english"); String et=en!=null?en.optString("text",""):h.optString("text","");
                    items.add(new HadithItem(n,h.optString("arabic",""),et,label));
                }
                loadHadithTranslations(index,chapterId,hadithUrdu,hadithHindi,hadithRoman);
                hadithCache.put(index+":"+chapterId,items);
                runOnUiThread(()->{content.removeView(loading);renderHadithItems(list,items);});
            }catch(Exception e){runOnUiThread(()->loading.setText("Unable to load this chapter. The bundled Hadith data may be unavailable."));}
        }).start();
        TextView back=text("‹  Back to Chapters",16,green,true); back.setPadding(22,18,22,18);
        back.setOnClickListener(v->openHadithBook(index)); content.addView(back);
    }

    private LinearLayout hadithReaderList;
    private java.util.List<HadithItem> hadithReaderItems=new java.util.ArrayList<>();

    private void loadHadithTranslations(int index,String chapterId,java.util.Map<Integer,String> urdu,java.util.Map<Integer,String> hindi,java.util.Map<Integer,String> roman){
        urdu.clear(); hindi.clear(); roman.clear();
        String id=HADITH_BOOKS[index].id;
        try{
            JSONObject u=getJson(HADITH_FA+"/urd-"+id+"/sections/"+chapterId+".json");
            org.json.JSONArray a=u.optJSONArray("hadiths"); if(a==null&&u.optJSONObject("data")!=null)a=u.getJSONObject("data").optJSONArray("hadiths");
            if(a!=null)for(int i=0;i<a.length();i++){JSONObject h=a.optJSONObject(i);if(h==null)continue;int n=h.optInt("hadithnumber",h.optInt("idInBook",h.optInt("id",0)));String t=h.optString("hadith","").trim();if(t.isEmpty())t=h.optString("text","").trim();if(n>0&&!t.isEmpty())urdu.put(n,t);}
        }catch(Exception ignored){}
        if(!chapterId.equals("introduction")){
            try{parseToonMap(getText(HADITH_TOON+"/"+id+"/translations/hi/sections/"+chapterId+".toon"),hindi);}catch(Exception ignored){}
            try{parseToonMap(getText(HADITH_TOON+"/"+id+"/translations/roman-ur/sections/"+chapterId+".toon"),roman);}catch(Exception ignored){}
        }
    }

    private void parseToonMap(String source,java.util.Map<Integer,String> out){
        if(source==null)return;
        java.util.regex.Matcher m=java.util.regex.Pattern.compile("^[A-Za-z_]+\\[(?:count|\\d+)\\]\\{([^}]+)\\}:\\s*",java.util.regex.Pattern.MULTILINE).matcher(source);
        if(!m.find())return;
        String[] columns=m.group(1).split(","); String body=source.substring(m.end()); StringBuilder current=new StringBuilder(); boolean quoted=false;
        for(String line:body.split("\\r?\\n")){
            if(line.trim().isEmpty())continue; if(current.length()>0)current.append("\\n"); current.append(line);
            int quotes=0;for(int i=0;i<line.length();i++)if(line.charAt(i)=='"'){if(i+1<line.length()&&line.charAt(i+1)=='"')i++;else quotes++;}
            if((quotes%2)==1)quoted=!quoted;
            if(!quoted){
                java.util.List<String> vals=parseCsvLine(current.toString());java.util.Map<String,String> row=new java.util.HashMap<>();
                for(int i=0;i<columns.length;i++)row.put(columns[i].trim(),i<vals.size()?vals.get(i):"");
                try{int n=Integer.parseInt(row.getOrDefault("hadithnumber","0"));String t=row.getOrDefault("text","").trim();if(n>0&&!t.isEmpty())out.put(n,t);}catch(Exception ignored){}
                current.setLength(0);
            }
        }
    }

    private java.util.List<String> parseCsvLine(String line){
        java.util.List<String> values=new java.util.ArrayList<>();StringBuilder cur=new StringBuilder();boolean quoted=false;
        for(int i=0;i<line.length();i++){char ch=line.charAt(i);if(quoted){if(ch=='"'&&i+1<line.length()&&line.charAt(i+1)=='"'){cur.append('"');i++;}else if(ch=='"')quoted=false;else cur.append(ch);}else if(ch=='"')quoted=true;else if(ch==','){values.add(cur.toString());cur.setLength(0);}else cur.append(ch);}values.add(cur.toString());return values;
    }

    private String getText(String url)throws Exception{
        HttpURLConnection c=(HttpURLConnection)new URL(url).openConnection();c.setConnectTimeout(8000);c.setReadTimeout(12000);c.setRequestMethod("GET");
        try{BufferedReader r=new BufferedReader(new InputStreamReader(c.getInputStream()));StringBuilder s=new StringBuilder();String line;while((line=r.readLine())!=null)s.append(line).append("\n");return s.toString();}finally{c.disconnect();}
    }

    private void openHadithSearchResult(int bookIndex,String chapterId,int hadithNo){
        hadithBookIndex=bookIndex;hadithChapterId=chapterId;
        content.removeAllViews();title.setText("Hadith "+hadithNo);
        String label=chapterId.equals("introduction")?"Introduction":"Chapter "+chapterId;
        addSection(HADITH_BOOKS[bookIndex].shortName+" • "+label,"Search result • Hadith "+hadithNo);
        TextView loading=text("Loading Hadith…",14,Color.GRAY,false);loading.setPadding(22,16,22,16);content.addView(loading);
        new Thread(()->{
            try{
                JSONObject root=getJson(HADITH_BASE+"/"+HADITH_BOOKS[bookIndex].id+"/"+chapterId+".json");org.json.JSONArray arr=root.optJSONArray("hadiths");HadithItem found=null;
                if(arr!=null)for(int i=0;i<arr.length();i++){JSONObject h=arr.optJSONObject(i);if(h==null)continue;int n=h.optInt("idInBook",h.optInt("id",i+1));if(n!=hadithNo)continue;JSONObject en=h.optJSONObject("english");String et=en!=null?en.optString("text",""):h.optString("text","");found=new HadithItem(n,h.optString("arabic",""),et,label);break;}
                final HadithItem item=found;runOnUiThread(()->{content.removeView(loading);if(item==null)addRow("Hadith not found","This search result is no longer available.");else{java.util.List<HadithItem> one=new java.util.ArrayList<>();one.add(item);renderHadithItems((LinearLayout)content,one);}});
            }catch(Exception e){runOnUiThread(()->loading.setText("Unable to load this Hadith."));}
        }).start();
        TextView back=text("‹  Back to Search",16,green,true);back.setPadding(22,18,22,18);back.setOnClickListener(v->showHadithSearch());content.addView(back);
    }

    private void showHadithSearch(){
        content.removeAllViews();title.setText("Search Hadith");
        EditText input=new EditText(this);input.setHint("Search words or Hadith number");input.setSingleLine(true);content.addView(input);
        Button go=new Button(this);go.setText("Search");go.setAllCaps(false);content.addView(go);
        LinearLayout results=new LinearLayout(this);results.setOrientation(LinearLayout.VERTICAL);content.addView(results);
        go.setOnClickListener(v->{String q=input.getText().toString().trim().toLowerCase();if(q.isEmpty())return;results.removeAllViews();TextView l=text("Searching…",14,Color.GRAY,false);results.addView(l);
            new Thread(()->{
                int found=0;
                outer:for(int bi=0;bi<HADITH_BOOKS.length;bi++)for(String chapterId:HADITH_BOOKS[bi].chapters){
                    try{
                        JSONObject root=getJson(HADITH_BASE+"/"+HADITH_BOOKS[bi].id+"/"+chapterId+".json");org.json.JSONArray arr=root.optJSONArray("hadiths");if(arr==null)continue;
                        for(int j=0;j<arr.length();j++){JSONObject h=arr.optJSONObject(j);if(h==null)continue;String text=(h.optString("arabic","")+" "+h.optString("text","")+" "+h.optString("chapter_intro","")).toLowerCase();int n=h.optInt("idInBook",h.optInt("id",j+1));
                            if(text.contains(q)||String.valueOf(n).equals(q)){final int fbi=bi;final String fcid=chapterId;final int fn=n;runOnUiThread(()->addActionRow(HADITH_BOOKS[fbi].shortName+" • "+(fcid.equals("introduction")?"Introduction":"Chapter "+fcid)+" • Hadith "+fn,"Open Hadith",()->openHadithSearchResult(fbi,fcid,fn)));found++;if(found>=30)break outer;}
                        }
                    }catch(Exception ignored){}
                }
                final int total=found;runOnUiThread(()->l.setText(total==0?"No Hadith found.":total+" result(s) shown."));
            }).start();
        });
        TextView back=text("‹  Back to Hadith",16,green,true);back.setPadding(22,18,22,18);back.setOnClickListener(v->showHadith());content.addView(back);
    }

    private void showPrayer(){
        title.setText("Prayer");
        addSection("Prayer Times","Calculated on-device • works offline after location is available");
        LinearLayout date=card();
        date.addView(text("TODAY",12,green,true));
        date.addView(text(new java.text.SimpleDateFormat("EEEE, dd MMMM yyyy",java.util.Locale.getDefault()).format(new java.util.Date()),18,Color.rgb(20,24,20),true));
        date.addView(text("Location is used only when you open Prayer/Location.",13,Color.GRAY,false));
        content.addView(date);
        String method=getPreferences(MODE_PRIVATE).getString("prayer_method","MWL • Muslim World League");
        android.location.Location loc=getPrayerLocation();
        if(loc!=null){
            PrayerTimes.Result t=PrayerTimes.calculate(loc.getLatitude(),loc.getLongitude(),new java.util.Date(),method);
            addPrayerRow("Fajr",t.fajr,"Dawn"); addPrayerRow("Dhuhr",t.dhuhr,"Midday");
            addPrayerRow("Asr",t.asr,"Afternoon"); addPrayerRow("Maghrib",t.maghrib,"Sunset"); addPrayerRow("Isha",t.isha,"Night");
        }else{
            for(String[] p:new String[][]{{"Fajr","Dawn"},{"Dhuhr","Midday"},{"Asr","Afternoon"},{"Maghrib","Sunset"},{"Isha","Night"}})addPrayerRow(p[0],"--:--",p[1]);
            addQuickButton(content,"Enable location","Allow location to calculate local prayer times",()->requestPrayerLocation());
        }
        LinearLayout tools=card(); tools.addView(text("WORSHIP TOOLS",12,green,true));
        addQuickButton(tools,"🧭  Qibla","Find the direction of the Kaaba",()->showQibla());
        addQuickButton(tools,"🔔  Prayer notifications","Adhan & reminder settings",()->showPremiumRequired("Advanced prayer notifications"));
        addQuickButton(tools,"📅  Prayer calendar","Daily prayer tracking",()->showPremiumRequired("Prayer calendar & tracking")); content.addView(tools);
        LinearLayout settings=card(); settings.addView(text("PRAYER SETTINGS",12,green,true));
        addQuickButton(settings,"Calculation method",method,()->showPrayerMethodDialog());
        addQuickButton(settings,"Location","Refresh device location",()->requestPrayerLocation()); content.addView(settings);
    }

    private android.location.Location getPrayerLocation(){
        if(android.os.Build.VERSION.SDK_INT>=23 &&
                checkSelfPermission(android.Manifest.permission.ACCESS_COARSE_LOCATION)!=android.content.pm.PackageManager.PERMISSION_GRANTED &&
                checkSelfPermission(android.Manifest.permission.ACCESS_FINE_LOCATION)!=android.content.pm.PackageManager.PERMISSION_GRANTED)return null;
        android.location.LocationManager lm=(android.location.LocationManager)getSystemService(LOCATION_SERVICE); if(lm==null)return null;
        android.location.Location best=null;
        try{if(lm.isProviderEnabled(android.location.LocationManager.GPS_PROVIDER))best=lm.getLastKnownLocation(android.location.LocationManager.GPS_PROVIDER);}catch(Exception ignored){}
        try{android.location.Location n=lm.getLastKnownLocation(android.location.LocationManager.NETWORK_PROVIDER);if(best==null||(n!=null&&n.getTime()>best.getTime()))best=n;}catch(Exception ignored){}
        return best;
    }

    private void addPrayerRow(String name,String time,String sub){
        LinearLayout c=card(); LinearLayout row=new LinearLayout(this); row.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout labels=new LinearLayout(this); labels.setOrientation(LinearLayout.VERTICAL);
        labels.addView(text(name,18,Color.rgb(20,24,20),true)); labels.addView(text(sub,12,Color.GRAY,false));
        row.addView(labels,new LinearLayout.LayoutParams(0,-2,1)); row.addView(text(time,22,green,true)); c.addView(row); content.addView(c);
    }

    private void showQibla(){
        android.location.Location loc=getPrayerLocation();
        if(loc==null){new AlertDialog.Builder(this).setTitle("Qibla").setMessage("Location permission is needed to calculate the Qibla direction.").setPositiveButton("Allow",(d,w)->requestPrayerLocation()).setNegativeButton("Cancel",null).show();return;}
        double a=Math.toRadians(loc.getLatitude()),b=Math.toRadians(loc.getLongitude()),c=Math.toRadians(21.422487),d=Math.toRadians(39.826206);
        double bearing=Math.toDegrees(Math.atan2(Math.sin(d-b)*Math.cos(c),Math.cos(a)*Math.sin(c)-Math.sin(a)*Math.cos(c)*Math.cos(d-b)));
        bearing=(bearing+360)%360; String dir=bearing<22.5||bearing>=337.5?"N":bearing<67.5?"NE":bearing<112.5?"E":bearing<157.5?"SE":bearing<202.5?"S":bearing<247.5?"SW":bearing<292.5?"W":"NW";
        new AlertDialog.Builder(this).setTitle("Qibla Direction").setMessage(String.format(java.util.Locale.getDefault(),"%.0f° from North • %s\nKaaba: Makkah",bearing,dir)).setPositiveButton("OK",null).show();
    }

    private void showPrayerMethodDialog(){
        String[] methods={"MWL • Muslim World League","ISNA • North America","Egyptian General Authority","Karachi • University of Islamic Sciences","Umm al-Qura • Makkah"};
        new AlertDialog.Builder(this).setTitle("Calculation Method").setSingleChoiceItems(methods,-1,(d,w)->{getPreferences(MODE_PRIVATE).edit().putString("prayer_method",methods[w]).apply();d.dismiss();showPrayer();}).show();
    }

    private void requestPrayerLocation(){
        if(android.os.Build.VERSION.SDK_INT>=23 &&
                checkSelfPermission(android.Manifest.permission.ACCESS_FINE_LOCATION)!=android.content.pm.PackageManager.PERMISSION_GRANTED &&
                checkSelfPermission(android.Manifest.permission.ACCESS_COARSE_LOCATION)!=android.content.pm.PackageManager.PERMISSION_GRANTED){
            requestPermissions(new String[]{android.Manifest.permission.ACCESS_FINE_LOCATION,android.Manifest.permission.ACCESS_COARSE_LOCATION},7001);
        }else showPrayer();
    }
    private void showProfile(){
        title.setText("Profile");
        addSection("Muslim Ummah","Account, Premium status, bookmarks, settings and app updates.");
        LinearLayout premium=card();
        premium.addView(text(PremiumManager.isPremium(this)?"PREMIUM ACTIVE":"PREMIUM",20,PremiumManager.isPremium(this)?green:Color.rgb(20,24,20),true));
        premium.addView(text(PremiumManager.isPremium(this)?"All unlocked Premium features are available.":"Unlock translations, advanced Quran/Hadith tools, audio, AI, personalization and more.",14,Color.DKGRAY,false));
        Button pbtn=new Button(this);pbtn.setText(PremiumManager.isPremium(this)?"View Premium features":"Explore Premium");pbtn.setAllCaps(false);
        pbtn.setOnClickListener(v->showPremiumFeatures());premium.addView(pbtn);content.addView(premium);
        addRow("Bookmarks","Qur'an & Hadith");
        addRow("Settings","Theme, language and preferences");
        addRow("App version",CURRENT_VERSION);
    }

    private void showPremiumFeatures(){
        content.removeAllViews(); title.setText("Premium");
        addSection("Muslim Ummah Premium","One place for all Premium tools. Access is controlled by verified entitlement.");
        String[] groups={
                "Qur'an • Translations • Tafsir • Word-by-word • Advanced Search • Notes • Khatm",
                "Audio • Multiple Qaris • Background Playback • Repeat • Offline Audio",
                "Hadith • Translations • Advanced Search • Collections • Notes • Highlights",
                "AI • Qur'an/Hadith references • Topic Search • Smart explanations",
                "Themes • Fonts • Mushaf Styles • Wallpapers • AMOLED • Custom Home",
                "Prayer • Advanced Notifications • Custom Adhan • Calendar • Tracking",
                "Qibla • Advanced Compass • AR • Mosque Finder • Travel Mode",
                "Dhikr • Goals • Streaks • Spiritual Stats • Worship Dashboard",
                "Cloud Sync • Smart Reminders • Widgets • Ramadan Mode"
        };
        for(String g:groups)addRow("Premium",g);
        TextView back=text("‹  Back to Profile",16,green,true);back.setPadding(22,18,22,18);back.setOnClickListener(v->showProfile());content.addView(back);
    }
    private void addCard(String h,String body,String action){LinearLayout c=card();c.addView(text(h,20,Color.rgb(20,24,20),true));TextView b=text(body,15,Color.DKGRAY,false);b.setPadding(0,8,0,14);c.addView(b);Button btn=new Button(this);btn.setText(action);btn.setAllCaps(false);btn.setTextColor(green);c.addView(btn);content.addView(c);}
    private void addSection(String h,String body){LinearLayout c=card();c.addView(text(h,21,Color.rgb(20,24,20),true));TextView b=text(body,15,Color.DKGRAY,false);b.setPadding(0,8,0,4);c.addView(b);content.addView(c);}
    private void addRow(String h,String body){LinearLayout c=card();LinearLayout row=new LinearLayout(this);row.setGravity(Gravity.CENTER_VERTICAL);LinearLayout labels=new LinearLayout(this);labels.setOrientation(LinearLayout.VERTICAL);labels.addView(text(h,17,Color.rgb(20,24,20),true));labels.addView(text(body,13,Color.GRAY,false));row.addView(labels,new LinearLayout.LayoutParams(0,-2,1));row.addView(text("›",28,green,false));c.addView(row);content.addView(c);}
    private LinearLayout card(){LinearLayout c=new LinearLayout(this);c.setOrientation(LinearLayout.VERTICAL);c.setPadding(22,20,22,20);c.setBackgroundColor(Color.WHITE);LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);p.setMargins(16,10,16,10);c.setLayoutParams(p);return c;}
    private TextView text(String s,int size,int color,boolean bold){TextView v=new TextView(this);v.setText(s);v.setTextSize(size);v.setTextColor(color);if(bold)v.setTypeface(Typeface.DEFAULT,Typeface.BOLD);return v;}

    private void registerDownloadReceiver(){downloadReceiver=new BroadcastReceiver(){public void onReceive(Context c,Intent i){if(i.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID,-1L)!=downloadId)return;DownloadManager m=(DownloadManager)getSystemService(DOWNLOAD_SERVICE);if(m==null)return;DownloadManager.Query q=new DownloadManager.Query().setFilterById(downloadId);android.database.Cursor cur=m.query(q);if(cur==null)return;try{if(cur.moveToFirst()&&cur.getInt(cur.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))==DownloadManager.STATUS_SUCCESSFUL)install(Uri.parse(cur.getString(cur.getColumnIndexOrThrow(DownloadManager.COLUMN_LOCAL_URI))));}finally{cur.close();}}};IntentFilter f=new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);if(Build.VERSION.SDK_INT>=33)registerReceiver(downloadReceiver,f,Context.RECEIVER_NOT_EXPORTED);else registerReceiver(downloadReceiver,f);}
    private void checkForUpdate(){new Thread(()->{try{HttpURLConnection c=(HttpURLConnection)new URL(UPDATE_URL+"?t="+System.currentTimeMillis()).openConnection();c.setConnectTimeout(5000);c.setReadTimeout(5000);BufferedReader r=new BufferedReader(new InputStreamReader(c.getInputStream()));StringBuilder s=new StringBuilder();String line;while((line=r.readLine())!=null)s.append(line);r.close();JSONObject d=new JSONObject(s.toString());String v=d.optString("version",CURRENT_VERSION);if(newer(v,CURRENT_VERSION))runOnUiThread(()->updateDialog(v,d.optString("apkUrl","")));c.disconnect();}catch(Exception ignored){}}).start();}
    private boolean newer(String a,String b){
        try{
            String[] x=a.replace("v","").split("[.]");
            String[] y=b.replace("v","").split("[.]");
            for(int i=0;i<Math.max(x.length,y.length);i++){
                int p=i<x.length?Integer.parseInt(x[i]):0;
                int q=i<y.length?Integer.parseInt(y[i]):0;
                if(p!=q)return p>q;
            }
        }catch(Exception ignored){}
        return false;
    }
    private void updateDialog(String v,String url){new AlertDialog.Builder(this).setTitle("Muslim Ummah update").setMessage("Version "+v+" is available.").setPositiveButton("Update",(d,w)->download(url)).setNegativeButton("Later",null).show();}
    private void download(String url){if(Build.VERSION.SDK_INT>=26&&!getPackageManager().canRequestPackageInstalls()){startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,Uri.parse("package:"+getPackageName())));return;}try{DownloadManager m=(DownloadManager)getSystemService(DOWNLOAD_SERVICE);DownloadManager.Request r=new DownloadManager.Request(Uri.parse(url));r.setTitle("Muslim Ummah Update").setMimeType("application/vnd.android.package-archive").setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);r.setDestinationInExternalFilesDir(this,Environment.DIRECTORY_DOWNLOADS,"muslim-ummah-update.apk");downloadId=m.enqueue(r);}catch(Exception ignored){}}
    private void install(Uri uri){try{Intent i=new Intent(Intent.ACTION_VIEW).setDataAndType(uri,"application/vnd.android.package-archive");i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);startActivity(i);}catch(Exception ignored){}}
    @Override protected void onDestroy(){if(downloadReceiver!=null)try{unregisterReceiver(downloadReceiver);}catch(Exception ignored){}super.onDestroy();}
    private JSONObject getJson(String url) throws Exception{
        if(url.startsWith(HADITH_BASE+"/")){
            String rel=url.substring((HADITH_BASE+"/").length());
            try(java.io.InputStream in=getAssets().open("hadith/the_9_books/"+rel)){
                BufferedReader r=new BufferedReader(new InputStreamReader(in));
                StringBuilder b=new StringBuilder(); String line;
                while((line=r.readLine())!=null)b.append(line).append('\n');
                return new JSONObject(b.toString());
            }catch(Exception assetError){
                // Fall back to network for data not bundled in the APK.
            }
        }
        HttpURLConnection c=(HttpURLConnection)new URL(url).openConnection();
        c.setConnectTimeout(8000); c.setReadTimeout(12000); c.setRequestMethod("GET");
        try{
            BufferedReader r=new BufferedReader(new InputStreamReader(c.getInputStream()));
            StringBuilder b=new StringBuilder(); String line;
            while((line=r.readLine())!=null)b.append(line).append('\n');
            return new JSONObject(b.toString());
        }finally{c.disconnect();}
    }

    private void loadHadithBookmarks(){
        hadithBookmarks.clear();
        String raw=getPreferences(MODE_PRIVATE).getString("hadith_bookmarks","");
        if(raw.isEmpty())return;
        for(String x:raw.split("\\|"))if(!x.trim().isEmpty())hadithBookmarks.add(x);
    }

    private void saveHadithBookmarks(){
        StringBuilder b=new StringBuilder();
        for(String x:hadithBookmarks){if(b.length()>0)b.append('|');b.append(x);}
        getPreferences(MODE_PRIVATE).edit().putString("hadith_bookmarks",b.toString()).apply();
    }

    private void renderHadithItems(LinearLayout list,java.util.List<HadithItem> items){
        list.removeAllViews(); if(items.isEmpty()){addRow("No Hadith found","This chapter has no readable entries.");return;}
        for(HadithItem h:items){LinearLayout c=card(); c.addView(text(HADITH_BOOKS[hadithBookIndex].shortName+" • Hadith "+h.number,13,green,true)); if(!h.arabic.isEmpty()){TextView a=text(h.arabic,22,Color.rgb(20,24,20),false);a.setGravity(Gravity.RIGHT);a.setTextIsSelectable(true);a.setPadding(0,12,0,12);c.addView(a);}
            String translated=h.english; String label="ENGLISH"; if("urdu".equals(hadithLanguage)){translated=hadithUrdu.get(h.number);label="URDU";}else if("hindi".equals(hadithLanguage)){translated=hadithHindi.get(h.number);label="HINDI";}else if("hinglish".equals(hadithLanguage)){translated=hadithRoman.get(h.number);label="HINGLISH / ROMAN URDU";} if(translated==null||translated.trim().isEmpty())translated=h.english;
            TextView l=text(label,11,green,true);l.setPadding(0,4,0,4);c.addView(l); TextView tr=text(translated==null||translated.isEmpty()?"Translation not available":translated,("urdu".equals(hadithLanguage)||"hindi".equals(hadithLanguage))?17:16,Color.rgb(35,40,35),false); if("urdu".equals(hadithLanguage))tr.setGravity(Gravity.RIGHT); tr.setTextIsSelectable(true); c.addView(tr);
            Button b=new Button(this);String k=hadithBookIndex+":"+hadithChapterId+":"+h.number;b.setText(hadithBookmarks.contains(k)?"★ Bookmarked":"☆ Bookmark");b.setAllCaps(false);b.setOnClickListener(v->{if(hadithBookmarks.contains(k))hadithBookmarks.remove(k);else hadithBookmarks.add(k);b.setText(hadithBookmarks.contains(k)?"★ Bookmarked":"☆ Bookmark");saveHadithBookmarks();});c.addView(b);list.addView(c);
        }
    }


}