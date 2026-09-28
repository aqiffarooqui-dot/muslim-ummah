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
    private void showHome(){title.setText("Assalamu Alaikum");addCard("Today's Reminder","A beautiful reminder from the Qur'an & Sunnah.","Read reminder");addCard("Qur'an","Continue your reading and keep your daily progress.","Open Qur'an");addCard("Hadith","Browse books → chapters → hadiths in a native reader.","Open Hadith");addCard("Prayer","Your prayer times, Qibla and daily worship tools.","Prayer times");}
    private void showQuran(){
        title.setText("Qur'an");
        addSection("Qur'an Reader","114 Surahs • Arabic • translations • bookmarks • progress");
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
    private void showSurah(QuranData.Surah x){
        content.removeAllViews(); title.setText(x.name);
        addSection(x.arabicName+"  •  "+x.englishName,x.revelation+" • "+x.ayahCount+" Ayahs");
        addActionRow("Read Surah","Arabic • offline after first load",()->openReader(x,"arabic"));
        addActionRow("Translations","Hindi/English/Urdu/Hinglish",()->openReader(x,"english"));
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
    private static final HadithBook[] HADITH_BOOKS={
        new HadithBook("bukhari","Sahih al-Bukhari","Bukhari",97,"eng-bukhari"),
        new HadithBook("muslim","Sahih Muslim","Muslim",56,"eng-muslim"),
        new HadithBook("abudawud","Sunan Abi Dawud","Abu Dawud",43,"eng-abudawud"),
        new HadithBook("tirmidhi","Jami at-Tirmidhi","Tirmidhi",49,"eng-tirmidhi"),
        new HadithBook("nasai","Sunan an-Nasa'i","Nasa'i",52,"eng-nasai"),
        new HadithBook("ibnmajah","Sunan Ibn Majah","Ibn Majah",37,"eng-ibnmajah")
    };
    private int hadithBookIndex=0,hadithBookNo=1; private String hadithChapter="";
    private String hadithLanguage="english";
    private final java.util.Map<String,java.util.List<HadithItem>> hadithCache=new java.util.HashMap<>();
    private final java.util.Map<Integer,String> hadithUrdu=new java.util.HashMap<>();
    private final java.util.Map<Integer,String> hadithHindi=new java.util.HashMap<>();
    private final java.util.Map<Integer,String> hadithRoman=new java.util.HashMap<>();
    private final java.util.Set<String> hadithBookmarks=new java.util.HashSet<>();

    private static final class HadithBook{
        final String id,name,shortName,edition; final int books;
        HadithBook(String id,String name,String shortName,int books,String edition){this.id=id;this.name=name;this.shortName=shortName;this.books=books;this.edition=edition;}
    }
    private static final class HadithItem{
        int number; String arabic="",english="",chapter=""; HadithItem(int n,String a,String e,String c){number=n;arabic=a;english=e;chapter=c;}
    }

    private void showHadith(){
        title.setText("Hadith");
        hadithChapter="";
        LinearLayout top=card(); top.addView(text("Hadith Library",21,Color.rgb(20,24,20),true));
        top.addView(text("Books → Chapters → Hadiths • Search • Bookmarks",14,Color.DKGRAY,false));
        Button search=new Button(this); search.setText("Search Hadith"); search.setAllCaps(false); search.setOnClickListener(v->showHadithSearch()); top.addView(search); content.addView(top);
        for(int i=0;i<HADITH_BOOKS.length;i++){final int index=i; HadithBook b=HADITH_BOOKS[i]; LinearLayout c=card(); c.setOrientation(LinearLayout.HORIZONTAL); c.setOnClickListener(v->openHadithBook(index)); ImageView cover=new ImageView(this); cover.setScaleType(ImageView.ScaleType.CENTER_CROP); cover.setImageResource(android.R.drawable.ic_menu_gallery); LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(92,132); cp.setMargins(0,0,16,0); c.addView(cover,cp); LinearLayout info=new LinearLayout(this); info.setOrientation(LinearLayout.VERTICAL); info.setGravity(Gravity.CENTER_VERTICAL); info.addView(text(b.name,18,Color.rgb(20,24,20),true)); info.addView(text(b.books+" Books • Arabic + English",13,Color.GRAY,false)); info.addView(text("Open collection  ›",13,green,true)); c.addView(info,new LinearLayout.LayoutParams(0,-1,1)); loadHadithCover(cover,index); content.addView(c);}
    }

    private void loadHadithCover(ImageView view,int index){
        final String[] urls={"https://commons.wikimedia.org/wiki/Special:FilePath/Sahih%20al-Bukhari.jpg","https://commons.wikimedia.org/wiki/Special:FilePath/Sahih%20Muslim.jpg","https://commons.wikimedia.org/wiki/Special:FilePath/Sunan%20Abi%20Dawud.jpg","https://commons.wikimedia.org/wiki/Special:FilePath/Jami%20at-Tirmidhi.jpg","https://commons.wikimedia.org/wiki/Special:FilePath/Sunan%20an-Nasa%27i.jpg","https://commons.wikimedia.org/wiki/Special:FilePath/Sunan%20Ibn%20Majah.jpg"};
        new Thread(()->{try{HttpURLConnection c=(HttpURLConnection)new URL(urls[index]).openConnection();c.setConnectTimeout(6000);c.setReadTimeout(8000);Bitmap b=BitmapFactory.decodeStream(c.getInputStream());c.disconnect();if(b!=null)runOnUiThread(()->view.setImageBitmap(b));}catch(Exception ignored){}}).start();
    }

    private void openHadithBook(int index){
        hadithBookIndex=index; hadithBookNo=1; hadithChapter="";
        title.setText(HADITH_BOOKS[index].name); content.removeAllViews();
        addSection(HADITH_BOOKS[index].name,HADITH_BOOKS[index].books+" Books • Select a Book to see its Chapters");
        TextView search=text("⌕  Search within this collection",15,green,true); search.setPadding(22,18,22,18); search.setOnClickListener(v->showHadithSearch()); content.addView(search);
        loadHadithBooks(index);
        TextView back=text("‹  Back to Collections",16,green,true); back.setPadding(22,18,22,18); back.setOnClickListener(v->showHadith()); content.addView(back);
    }

    private void loadHadithBooks(int index){
        final LinearLayout list=new LinearLayout(this); list.setOrientation(LinearLayout.VERTICAL); content.addView(list,1);
        TextView loading=text("Loading books…",14,Color.GRAY,false); list.addView(loading);
        new Thread(()->{
            try{
                JSONObject d=getJson(HADITH_FA+"/"+HADITH_BOOKS[index].edition+".json");
                java.util.List<String> names=new java.util.ArrayList<>();
                JSONObject sections=d.optJSONObject("metadata")!=null?d.getJSONObject("metadata").optJSONObject("sections"):null;
                if(sections!=null){java.util.Iterator<String> it=sections.keys(); while(it.hasNext()){String k=it.next(); names.add(k+"|"+sections.optString(k));}}
                runOnUiThread(()->{
                    list.removeAllViews();
                    for(String row:names){String[] p=row.split("\\|",2); int no; try{no=Integer.parseInt(p[0]);}catch(Exception e){continue;} final int n=no; addActionRow("Book "+no+(p.length>1?" • "+p[1]:""),"Open chapters",()->openHadithBookNumber(index,n));}
                    if(names.isEmpty()) for(int n=1;n<=HADITH_BOOKS[index].books;n++){final int no=n;addActionRow("Book "+n,"Open chapters",()->openHadithBookNumber(index,no));}
                });
            }catch(Exception e){runOnUiThread(()->{loading.setText("Books could not load. Check internet and try again.");});}
        }).start();
    }

    private void openHadithBookNumber(int index,int bookNo){
        hadithBookIndex=index; hadithBookNo=bookNo; hadithChapter=""; content.removeAllViews(); title.setText("Book "+bookNo);
        addSection(HADITH_BOOKS[index].name+" • Book "+bookNo,"Select a chapter");
        TextView loading=text("Loading chapters…",14,Color.GRAY,false); loading.setPadding(22,16,22,16); content.addView(loading);
        new Thread(()->{
            try{
                String key=HADITH_BOOKS[index].id+"/"+bookNo+".json"; JSONObject root=getJson(HADITH_BASE+"/"+key);
                org.json.JSONArray arr=root.optJSONArray("hadiths"); java.util.LinkedHashMap<String,Integer> chapters=new java.util.LinkedHashMap<>();
                if(arr!=null) for(int i=0;i<arr.length();i++){JSONObject h=arr.optJSONObject(i); if(h==null)continue; String c=h.optString("chapter_intro","").trim(); if(c.isEmpty()){int id=h.optInt("chapterId",0); c=id>0?"Chapter "+id:"Chapter";} if(!chapters.containsKey(c))chapters.put(c,0); chapters.put(c,chapters.get(c)+1);}
                runOnUiThread(()->{content.removeView(loading); for(java.util.Map.Entry<String,Integer> e:chapters.entrySet()){final String c=e.getKey(); addActionRow(c,e.getValue()+" Hadiths",()->openHadithChapter(c));} if(chapters.isEmpty()) addRow("No chapters","No chapter data found");});
            }catch(Exception e){runOnUiThread(()->loading.setText("Unable to load chapters. Please check your connection."));}
        }).start();
        TextView back=text("‹  Back to Books",16,green,true); back.setPadding(22,18,22,18); back.setOnClickListener(v->openHadithBook(index)); content.addView(back);
    }

    private void openHadithChapter(String chapter){
        hadithChapter=chapter; hadithLanguage="english"; content.removeAllViews(); title.setText("Hadiths");
        addSection(HADITH_BOOKS[hadithBookIndex].shortName+" • Book "+hadithBookNo,chapter);
        LinearLayout languageRow=new LinearLayout(this); languageRow.setGravity(Gravity.CENTER_VERTICAL);
        String[] labels={"English","اردو","हिन्दी","Hinglish"}; String[] keys={"english","urdu","hindi","hinglish"};
        for(int i=0;i<labels.length;i++){ final String key=keys[i]; Button b=new Button(this); b.setText(labels[i]); b.setAllCaps(false); b.setOnClickListener(v->{hadithLanguage=key; renderHadithItems(hadithReaderList,hadithReaderItems);}); languageRow.addView(b,new LinearLayout.LayoutParams(0,-2,1)); }
        content.addView(languageRow);
        TextView loading=text("Loading Hadiths and translations…",14,Color.GRAY,false); loading.setPadding(22,12,22,12); content.addView(loading);
        final LinearLayout list=new LinearLayout(this); list.setOrientation(LinearLayout.VERTICAL); hadithReaderList=list;
        final java.util.List<HadithItem> items=new java.util.ArrayList<>(); hadithReaderItems=items; content.addView(list);
        new Thread(()->{
            try{
                String key=HADITH_BOOKS[hadithBookIndex].id+"/"+hadithBookNo+".json";
                JSONObject root=getJson(HADITH_BASE+"/"+key); org.json.JSONArray arr=root.optJSONArray("hadiths");
                if(arr!=null) for(int i=0;i<arr.length();i++){JSONObject h=arr.optJSONObject(i); if(h==null)continue; String c=h.optString("chapter_intro","").trim(); if(c.isEmpty()){int id=h.optInt("chapterId",0); c=id>0?"Chapter "+id:"Chapter";} if(!c.equalsIgnoreCase(chapter))continue; int n=h.optInt("idInBook",h.optInt("id",i+1)); JSONObject en=h.optJSONObject("english"); String et=en!=null?en.optString("text",""):h.optString("text",""); items.add(new HadithItem(n,h.optString("arabic",""),et,c));}
                loadHadithTranslations(hadithBookIndex,hadithBookNo,hadithUrdu,hadithHindi,hadithRoman);
                String cacheKey=hadithBookIndex+":"+hadithBookNo+":"+chapter; hadithCache.put(cacheKey,items);
                runOnUiThread(()->{content.removeView(loading); renderHadithItems(list,items);});
            }catch(Exception e){runOnUiThread(()->loading.setText("Unable to load Hadiths. Please check your connection."));}
        }).start();
        TextView back=text("‹  Back to Chapters",16,green,true); back.setPadding(22,18,22,18); back.setOnClickListener(v->openHadithBookNumber(hadithBookIndex,hadithBookNo)); content.addView(back);
    }

    private LinearLayout hadithReaderList;
    private java.util.List<HadithItem> hadithReaderItems=new java.util.ArrayList<>();

    private void loadHadithTranslations(int index,int bookNo,java.util.Map<Integer,String> urdu,java.util.Map<Integer,String> hindi,java.util.Map<Integer,String> roman){
        urdu.clear(); hindi.clear(); roman.clear();
        String id=HADITH_BOOKS[index].id;
        try{
            JSONObject u=getJson(HADITH_FA+"/urd-"+id+"/sections/"+bookNo+".json");
            org.json.JSONArray a=u.optJSONArray("hadiths"); if(a==null && u.optJSONObject("data")!=null)a=u.getJSONObject("data").optJSONArray("hadiths");
            if(a!=null) for(int i=0;i<a.length();i++){JSONObject h=a.optJSONObject(i); if(h==null)continue; int n=h.optInt("hadithnumber",h.optInt("idInBook",h.optInt("id",0))); String t=h.optString("hadith","").trim(); if(t.isEmpty())t=h.optString("text","").trim(); if(n>0&&!t.isEmpty())urdu.put(n,t);}
        }catch(Exception ignored){}
        try{
            String hi=getText(HADITH_TOON+"/"+id+"/translations/hi/sections/"+bookNo+".toon");
            parseToonMap(hi,hindi);
        }catch(Exception ignored){}
        try{
            String ro=getText(HADITH_TOON+"/"+id+"/translations/roman-ur/sections/"+bookNo+".toon");
            parseToonMap(ro,roman);
        }catch(Exception ignored){}
    }

    private void parseToonMap(String source,java.util.Map<Integer,String> out){
        if(source==null)return;
        java.util.regex.Matcher m=java.util.regex.Pattern.compile("^[A-Za-z_]+\\[(?:count|\\d+)\\]\\{([^}]+)\\}:\\s*",java.util.regex.Pattern.MULTILINE).matcher(source);
        if(!m.find())return;
        String[] columns=m.group(1).split(",");
        String body=source.substring(m.end()); StringBuilder current=new StringBuilder(); boolean quoted=false;
        String[] lines=body.split("\\r?\
");
        for(String line:lines){
            if(line.trim().isEmpty())continue;
            if(current.length()>0)current.append("\
"); current.append(line);
            int quotes=0; for(int i=0;i<line.length();i++)if(line.charAt(i)=='"') {if(i+1<line.length()&&line.charAt(i+1)=='"')i++;else quotes++;}
            if((quotes%2)==1)quoted=!quoted;
            if(!quoted){
                java.util.List<String> vals=parseCsvLine(current.toString()); java.util.Map<String,String> row=new java.util.HashMap<>();
                for(int i=0;i<columns.length;i++)row.put(columns[i].trim(),i<vals.size()?vals.get(i):"");
                try{int n=Integer.parseInt(row.getOrDefault("hadithnumber","0")); String t=row.getOrDefault("text","").trim(); if(n>0&&!t.isEmpty())out.put(n,t);}catch(Exception ignored){}
                current.setLength(0);
            }
        }
    }

    private java.util.List<String> parseCsvLine(String line){
        java.util.List<String> values=new java.util.ArrayList<>(); StringBuilder cur=new StringBuilder(); boolean quoted=false;
        for(int i=0;i<line.length();i++){char ch=line.charAt(i); if(quoted){if(ch=='"'&&i+1<line.length()&&line.charAt(i+1)=='"'){cur.append('"');i++;}else if(ch=='"')quoted=false;else cur.append(ch);}else if(ch=='"')quoted=true;else if(ch==','){values.add(cur.toString());cur.setLength(0);}else cur.append(ch);} values.add(cur.toString()); return values;
    }

    private String getText(String url)throws Exception{
        HttpURLConnection c=(HttpURLConnection)new URL(url).openConnection(); c.setConnectTimeout(8000); c.setReadTimeout(12000); c.setRequestMethod("GET");
        try{BufferedReader r=new BufferedReader(new InputStreamReader(c.getInputStream()));StringBuilder s=new StringBuilder();String line;while((line=r.readLine())!=null)s.append(line).append("
");return s.toString();}finally{c.disconnect();}
    }

    private void openHadithSearchResult(int bookIndex,int bookNo,int hadithNo){
        hadithBookIndex=bookIndex; hadithBookNo=bookNo;
        content.removeAllViews(); title.setText("Hadith "+hadithNo);
        addSection(HADITH_BOOKS[bookIndex].shortName+" • Book "+bookNo,"Search result • Hadith "+hadithNo);
        TextView loading=text("Loading Hadith…",14,Color.GRAY,false); loading.setPadding(22,16,22,16); content.addView(loading);
        new Thread(()->{
            try{
                JSONObject root=getJson(HADITH_BASE+"/"+HADITH_BOOKS[bookIndex].id+"/"+bookNo+".json");
                org.json.JSONArray arr=root.optJSONArray("hadiths"); HadithItem found=null;
                if(arr!=null) for(int i=0;i<arr.length();i++){JSONObject h=arr.optJSONObject(i); if(h==null)continue; int n=h.optInt("idInBook",h.optInt("id",i+1)); if(n!=hadithNo)continue; JSONObject en=h.optJSONObject("english"); String et=en!=null?en.optString("text",""):h.optString("text",""); String ch=h.optString("chapter_intro","").trim(); if(ch.isEmpty()){int id=h.optInt("chapterId",0); ch=id>0?"Chapter "+id:"Chapter";} found=new HadithItem(n,h.optString("arabic",""),et,ch); break;}
                final HadithItem item=found; runOnUiThread(()->{content.removeView(loading); if(item==null){addRow("Hadith not found","This search result is no longer available.");}else{java.util.List<HadithItem> one=new java.util.ArrayList<>();one.add(item);renderHadithItems((LinearLayout)content,one);} });
            }catch(Exception e){runOnUiThread(()->loading.setText("Unable to load this Hadith. Please check your connection."));}
        }).start();
        TextView back=text("‹  Back to Search",16,green,true); back.setPadding(22,18,22,18); back.setOnClickListener(v->showHadithSearch()); content.addView(back);
    }

    private void showHadithSearch(){
        content.removeAllViews(); title.setText("Search Hadith"); EditText input=new EditText(this);input.setHint("Search words or Hadith number");input.setSingleLine(true);content.addView(input);Button go=new Button(this);go.setText("Search");go.setAllCaps(false);content.addView(go);LinearLayout results=new LinearLayout(this);results.setOrientation(LinearLayout.VERTICAL);content.addView(results);go.setOnClickListener(v->{String q=input.getText().toString().trim().toLowerCase();if(q.isEmpty())return;results.removeAllViews();TextView l=text("Searching…",14,Color.GRAY,false);results.addView(l);new Thread(()->{int found=0;for(int bi=0;bi<HADITH_BOOKS.length&&found<30;bi++){for(int bn=1;bn<=HADITH_BOOKS[bi].books&&found<30;bn++){try{JSONObject root=getJson(HADITH_BASE+"/"+HADITH_BOOKS[bi].id+"/"+bn+".json");org.json.JSONArray arr=root.optJSONArray("hadiths");if(arr==null)continue;for(int j=0;j<arr.length()&&found<30;j++){JSONObject h=arr.optJSONObject(j);if(h==null)continue;String text=(h.optString("arabic","")+" "+h.optString("text","")+" "+h.optString("chapter_intro","")).toLowerCase();int n=h.optInt("idInBook",h.optInt("id",j+1));if(text.contains(q)||String.valueOf(n).equals(q)){final int fbi=bi,fbn=bn,fn=n;runOnUiThread(()->addActionRow(HADITH_BOOKS[fbi].shortName+" • Hadith "+fn,"Open Hadith",()->openHadithSearchResult(fbi,fbn,fn)));found++;}}}catch(Exception ignored){}}}final int total=found;runOnUiThread(()->{if(total==0)l.setText("No Hadith found.");else l.setText(total+" result(s) shown.");});}).start();});TextView back=text("‹  Back to Hadith",16,green,true);back.setPadding(22,18,22,18);back.setOnClickListener(v->showHadith());content.addView(back);
    }

    private JSONObject getJson(String url)throws Exception{HttpURLConnection c=(HttpURLConnection)new URL(url).openConnection();c.setConnectTimeout(8000);c.setReadTimeout(12000);c.setRequestMethod("GET");try{BufferedReader r=new BufferedReader(new InputStreamReader(c.getInputStream()));StringBuilder s=new StringBuilder();String line;while((line=r.readLine())!=null)s.append(line);return new JSONObject(s.toString());}finally{c.disconnect();}}
    private void saveHadithBookmarks(){getPreferences(MODE_PRIVATE).edit().putStringSet("hadith_bookmarks",new java.util.HashSet<>(hadithBookmarks)).apply();}
    private void loadHadithBookmarks(){java.util.Set<String> s=getPreferences(MODE_PRIVATE).getStringSet("hadith_bookmarks",null);if(s!=null)hadithBookmarks.addAll(s);}

    private void showPrayer(){title.setText("Prayer");addSection("Prayer Times","Native prayer screen foundation. Location, calculation method, Qibla and local caching will be connected next.");addRow("Fajr","--:--");addRow("Dhuhr","--:--");addRow("Asr","--:--");addRow("Maghrib","--:--");addRow("Isha","--:--");}
    private void showProfile(){title.setText("Profile");addSection("Muslim Ummah","Your account, Premium status, bookmarks, settings and app updates.");addRow("Premium","Server-verified entitlement");addRow("Bookmarks","Qur'an & Hadith");addRow("Settings","Theme, language and preferences");addRow("App version",CURRENT_VERSION);}
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
    private void renderHadithItems(LinearLayout list,java.util.List<HadithItem> items){
        list.removeAllViews(); if(items.isEmpty()){addRow("No Hadith found","This chapter has no readable entries.");return;}
        for(HadithItem h:items){LinearLayout c=card(); c.addView(text(HADITH_BOOKS[hadithBookIndex].shortName+" • Hadith "+h.number,13,green,true)); if(!h.arabic.isEmpty()){TextView a=text(h.arabic,22,Color.rgb(20,24,20),false);a.setGravity(Gravity.RIGHT);a.setTextIsSelectable(true);a.setPadding(0,12,0,12);c.addView(a);}
            String translated=h.english; String label="ENGLISH"; if("urdu".equals(hadithLanguage)){translated=hadithUrdu.get(h.number);label="URDU";}else if("hindi".equals(hadithLanguage)){translated=hadithHindi.get(h.number);label="HINDI";}else if("hinglish".equals(hadithLanguage)){translated=hadithRoman.get(h.number);label="HINGLISH / ROMAN URDU";}
            TextView l=text(label,11,green,true);l.setPadding(0,4,0,4);c.addView(l); TextView tr=text(translated==null||translated.isEmpty()?"Translation not available":translated,("urdu".equals(hadithLanguage)||"hindi".equals(hadithLanguage))?17:16,Color.rgb(35,40,35),false); if("urdu".equals(hadithLanguage))tr.setGravity(Gravity.RIGHT); tr.setTextIsSelectable(true); c.addView(tr);
            Button b=new Button(this);String k=hadithBookIndex+":"+hadithBookNo+":"+h.number;b.setText(hadithBookmarks.contains(k)?"★ Bookmarked":"☆ Bookmark");b.setAllCaps(false);b.setOnClickListener(v->{if(hadithBookmarks.contains(k))hadithBookmarks.remove(k);else hadithBookmarks.add(k);b.setText(hadithBookmarks.contains(k)?"★ Bookmarked":"☆ Bookmark");saveHadithBookmarks();});c.addView(b);list.addView(c);
        }
    }

    private void openHadithSearchResult(int bookIndex,int bookNo,int hadithNo){
        hadithBookIndex=bookIndex; hadithBookNo=bookNo;
        content.removeAllViews(); title.setText("Hadith "+hadithNo);
        addSection(HADITH_BOOKS[bookIndex].shortName+" • Book "+bookNo,"Search result • Hadith "+hadithNo);
        TextView loading=text("Loading Hadith…",14,Color.GRAY,false); loading.setPadding(22,16,22,16); content.addView(loading);
        new Thread(()->{
            try{
                JSONObject root=getJson(HADITH_BASE+"/"+HADITH_BOOKS[bookIndex].id+"/"+bookNo+".json");
                org.json.JSONArray arr=root.optJSONArray("hadiths"); HadithItem found=null;
                if(arr!=null) for(int i=0;i<arr.length();i++){JSONObject h=arr.optJSONObject(i); if(h==null)continue; int n=h.optInt("idInBook",h.optInt("id",i+1)); if(n!=hadithNo)continue; JSONObject en=h.optJSONObject("english"); String et=en!=null?en.optString("text",""):h.optString("text",""); String ch=h.optString("chapter_intro","").trim(); if(ch.isEmpty()){int id=h.optInt("chapterId",0); ch=id>0?"Chapter "+id:"Chapter";} found=new HadithItem(n,h.optString("arabic",""),et,ch); break;}
                final HadithItem item=found; runOnUiThread(()->{content.removeView(loading); if(item==null){addRow("Hadith not found","This search result is no longer available.");}else{java.util.List<HadithItem> one=new java.util.ArrayList<>();one.add(item);renderHadithItems((LinearLayout)content,one);} });
            }catch(Exception e){runOnUiThread(()->loading.setText("Unable to load this Hadith. Please check your connection."));}
        }).start();
        TextView back=text("‹  Back to Search",16,green,true); back.setPadding(22,18,22,18); back.setOnClickListener(v->showHadithSearch()); content.addView(back);
    }

    private void showHadithSearch(){
        content.removeAllViews(); title.setText("Search Hadith"); EditText input=new EditText(this);input.setHint("Search words or Hadith number");input.setSingleLine(true);content.addView(input);Button go=new Button(this);go.setText("Search");go.setAllCaps(false);content.addView(go);LinearLayout results=new LinearLayout(this);results.setOrientation(LinearLayout.VERTICAL);content.addView(results);go.setOnClickListener(v->{String q=input.getText().toString().trim().toLowerCase();if(q.isEmpty())return;results.removeAllViews();TextView l=text("Searching…",14,Color.GRAY,false);results.addView(l);new Thread(()->{int found=0;for(int bi=0;bi<HADITH_BOOKS.length&&found<30;bi++){for(int bn=1;bn<=HADITH_BOOKS[bi].books&&found<30;bn++){try{JSONObject root=getJson(HADITH_BASE+"/"+HADITH_BOOKS[bi].id+"/"+bn+".json");org.json.JSONArray arr=root.optJSONArray("hadiths");if(arr==null)continue;for(int j=0;j<arr.length()&&found<30;j++){JSONObject h=arr.optJSONObject(j);if(h==null)continue;String text=(h.optString("arabic","")+" "+h.optString("text","")+" "+h.optString("chapter_intro","")).toLowerCase();int n=h.optInt("idInBook",h.optInt("id",j+1));if(text.contains(q)||String.valueOf(n).equals(q)){final int fbi=bi,fbn=bn,fn=n;runOnUiThread(()->addActionRow(HADITH_BOOKS[fbi].shortName+" • Hadith "+fn,"Open Book "+fbn,()->openHadithBookNumber(fbi,fbn)));found++;}}}catch(Exception ignored){}}}final int total=found;runOnUiThread(()->{if(total==0)l.setText("No Hadith found.");else l.setText(total+" result(s) shown.");});}).start();});TextView back=text("‹  Back to Hadith",16,green,true);back.setPadding(22,18,22,18);back.setOnClickListener(v->showHadith());content.addView(back);
    }

    private JSONObject getJson(String url)throws Exception{HttpURLConnection c=(HttpURLConnection)new URL(url).openConnection();c.setConnectTimeout(8000);c.setReadTimeout(12000);c.setRequestMethod("GET");try{BufferedReader r=new BufferedReader(new InputStreamReader(c.getInputStream()));StringBuilder s=new StringBuilder();String line;while((line=r.readLine())!=null)s.append(line);return new JSONObject(s.toString());}finally{c.disconnect();}}
    private void saveHadithBookmarks(){getPreferences(MODE_PRIVATE).edit().putStringSet("hadith_bookmarks",new java.util.HashSet<>(hadithBookmarks)).apply();}
    private void loadHadithBookmarks(){java.util.Set<String> s=getPreferences(MODE_PRIVATE).getStringSet("hadith_bookmarks",null);if(s!=null)hadithBookmarks.addAll(s);}

    private void showPrayer(){title.setText("Prayer");addSection("Prayer Times","Native prayer screen foundation. Location, calculation method, Qibla and local caching will be connected next.");addRow("Fajr","--:--");addRow("Dhuhr","--:--");addRow("Asr","--:--");addRow("Maghrib","--:--");addRow("Isha","--:--");}
    private void showProfile(){title.setText("Profile");addSection("Muslim Ummah","Your account, Premium status, bookmarks, settings and app updates.");addRow("Premium","Server-verified entitlement");addRow("Bookmarks","Qur'an & Hadith");addRow("Settings","Theme, language and preferences");addRow("App version",CURRENT_VERSION);}
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
}