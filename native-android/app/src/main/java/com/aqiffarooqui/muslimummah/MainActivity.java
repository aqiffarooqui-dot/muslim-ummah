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
import android.widget.*;\nimport java.util.List;

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

    @Override public void onCreate(Bundle state){super.onCreate(state);buildApp();registerDownloadReceiver();checkForUpdate();}

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
        list.addView(c);
        getPreferences(MODE_PRIVATE).edit().putString("quran_progress",x.number+":"+a.number).apply();
    }
    private void toggleBookmark(int s,int a){String k="quran_bookmark_"+s+"_"+a;android.content.SharedPreferences p=getPreferences(MODE_PRIVATE);p.edit().putBoolean(k,!p.getBoolean(k,false)).apply();}
    private boolean isBookmarked(int s,int a){return getPreferences(MODE_PRIVATE).getBoolean("quran_bookmark_"+s+"_"+a,false);}
    private void openBookmarked(QuranData.Surah x){
        for(int i=1;i<=x.ayahCount;i++) if(isBookmarked(x.number,i)){openReader(x,"arabic");return;}
        new AlertDialog.Builder(this).setTitle("No bookmark").setMessage("No saved Ayah in "+x.name+" yet.").setPositiveButton("OK",null).show();
    }
    private void showHadith(){title.setText("Hadith");addSection("Hadith Library","Native nested navigation: Books → Chapters → Hadiths. Search and bookmarks will be integrated into the native reader.");addRow("Sahih al-Bukhari","Books and chapters");addRow("Sahih Muslim","Books and chapters");addRow("Abu Dawud","Books and chapters");addRow("Search Hadith","Search across the library");}
    private void showPrayer(){title.setText("Prayer");addSection("Prayer Times","Native prayer screen foundation. Location, calculation method, Qibla and local caching will be connected next.");addRow("Fajr","--:--");addRow("Dhuhr","--:--");addRow("Asr","--:--");addRow("Maghrib","--:--");addRow("Isha","--:--");}
    private void showProfile(){title.setText("Profile");addSection("Muslim Ummah","Your account, Premium status, bookmarks, settings and app updates.");addRow("Premium","Server-verified entitlement");addRow("Bookmarks","Qur'an & Hadith");addRow("Settings","Theme, language and preferences");addRow("App version",CURRENT_VERSION);}
    private void addCard(String h,String body,String action){LinearLayout c=card();c.addView(text(h,20,Color.rgb(20,24,20),true));TextView b=text(body,15,Color.DKGRAY,false);b.setPadding(0,8,0,14);c.addView(b);Button btn=new Button(this);btn.setText(action);btn.setAllCaps(false);btn.setTextColor(green);c.addView(btn);content.addView(c);}
    private void addSection(String h,String body){LinearLayout c=card();c.addView(text(h,21,Color.rgb(20,24,20),true));TextView b=text(body,15,Color.DKGRAY,false);b.setPadding(0,8,0,4);c.addView(b);content.addView(c);}
    private void addRow(String h,String body){LinearLayout c=card();LinearLayout row=new LinearLayout(this);row.setGravity(Gravity.CENTER_VERTICAL);LinearLayout labels=new LinearLayout(this);labels.setOrientation(LinearLayout.VERTICAL);labels.addView(text(h,17,Color.rgb(20,24,20),true));labels.addView(text(body,13,Color.GRAY,false));row.addView(labels,new LinearLayout.LayoutParams(0,-2,1));row.addView(text("›",28,green,false));c.addView(row);content.addView(c);}
    private LinearLayout card(){LinearLayout c=new LinearLayout(this);c.setOrientation(LinearLayout.VERTICAL);c.setPadding(22,20,22,20);c.setBackgroundColor(Color.WHITE);LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);p.setMargins(16,10,16,10);c.setLayoutParams(p);return c;}
    private TextView text(String s,int size,int color,boolean bold){TextView v=new TextView(this);v.setText(s);v.setTextSize(size);v.setTextColor(color);if(bold)v.setTypeface(Typeface.DEFAULT,Typeface.BOLD);return v;}

    private void registerDownloadReceiver(){downloadReceiver=new BroadcastReceiver(){public void onReceive(Context c,Intent i){if(i.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID,-1L)!=downloadId)return;DownloadManager m=(DownloadManager)getSystemService(DOWNLOAD_SERVICE);if(m==null)return;DownloadManager.Query q=new DownloadManager.Query().setFilterById(downloadId);android.database.Cursor cur=m.query(q);if(cur==null)return;try{if(cur.moveToFirst()&&cur.getInt(cur.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))==DownloadManager.STATUS_SUCCESSFUL)install(Uri.parse(cur.getString(cur.getColumnIndexOrThrow(DownloadManager.COLUMN_LOCAL_URI))));}finally{cur.close();}}};IntentFilter f=new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);if(Build.VERSION.SDK_INT>=33)registerReceiver(downloadReceiver,f,Context.RECEIVER_NOT_EXPORTED);else registerReceiver(downloadReceiver,f);}
    private void checkForUpdate(){new Thread(()->{try{HttpURLConnection c=(HttpURLConnection)new URL(UPDATE_URL+"?t="+System.currentTimeMillis()).openConnection();c.setConnectTimeout(5000);c.setReadTimeout(5000);BufferedReader r=new BufferedReader(new InputStreamReader(c.getInputStream()));StringBuilder s=new StringBuilder();String line;while((line=r.readLine())!=null)s.append(line);r.close();JSONObject d=new JSONObject(s.toString());String v=d.optString("version",CURRENT_VERSION);if(newer(v,CURRENT_VERSION))runOnUiThread(()->updateDialog(v,d.optString("apkUrl","")));c.disconnect();}catch(Exception ignored){}}).start();}
    private boolean newer(String a,String b){try{String[] x=a.replace("v","").split("\."),y=b.replace("v","").split("\.");for(int i=0;i<Math.max(x.length,y.length);i++){int p=i<x.length?Integer.parseInt(x[i]):0,q=i<y.length?Integer.parseInt(y[i]):0;if(p!=q)return p>q;}}catch(Exception ignored){}return false;}
    private void updateDialog(String v,String url){new AlertDialog.Builder(this).setTitle("Muslim Ummah update").setMessage("Version "+v+" is available.").setPositiveButton("Update",(d,w)->download(url)).setNegativeButton("Later",null).show();}
    private void download(String url){if(Build.VERSION.SDK_INT>=26&&!getPackageManager().canRequestPackageInstalls()){startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,Uri.parse("package:"+getPackageName())));return;}try{DownloadManager m=(DownloadManager)getSystemService(DOWNLOAD_SERVICE);DownloadManager.Request r=new DownloadManager.Request(Uri.parse(url));r.setTitle("Muslim Ummah Update").setMimeType("application/vnd.android.package-archive").setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);r.setDestinationInExternalFilesDir(this,Environment.DIRECTORY_DOWNLOADS,"muslim-ummah-update.apk");downloadId=m.enqueue(r);}catch(Exception ignored){}}
    private void install(Uri uri){try{Intent i=new Intent(Intent.ACTION_VIEW).setDataAndType(uri,"application/vnd.android.package-archive");i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);startActivity(i);}catch(Exception ignored){}}
    @Override protected void onDestroy(){if(downloadReceiver!=null)try{unregisterReceiver(downloadReceiver);}catch(Exception ignored){}super.onDestroy();}
}