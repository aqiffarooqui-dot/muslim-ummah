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
    private void showQuran(){title.setText("Qur'an");addSection("Qur'an Reader","Native reader foundation. Surah list, Arabic text, translations, bookmarks and progress will live here.");addRow("Surah","Browse all 114 Surahs");addRow("Juz","Read by Juz");addRow("Bookmarks","Your saved Ayahs");addRow("Translations","Hindi • English • Urdu • Hinglish");}
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