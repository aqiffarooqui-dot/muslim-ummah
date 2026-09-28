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
                        for(int j=0;j<arr.length();j++){JSONObject h=arr.optJSONObject(j);if(h==null)continue;JSONObject enSearch=h.optJSONObject("english"); String searchText=(h.optString("arabic","")+" "+h.optString("text","")+" "+h.optString("chapter_intro","")+" "+(enSearch==null?"":enSearch.optString("text",""))+" "+(enSearch==null?"":enSearch.optString("chapter",""))).toLowerCase();int n=h.optInt("idInBook",h.optInt("id",j+1));
                            if(searchText.contains(q)||String.valueOf(n).equals(q)){final int fbi=bi;final String fcid=chapterId;final int fn=n;String preview=h.optString("arabic",""); if(preview.isEmpty()&&enSearch!=null)preview=enSearch.optString("text",""); preview=preview.replaceAll("\\s+"," ").trim(); if(preview.length()>120)preview=preview.substring(0,120)+"…"; final String fp=preview; runOnUiThread(()->addActionRow(HADITH_BOOKS[fbi].shortName+" • "+(fcid.equals("introduction")?"Introduction":"Chapter "+fcid)+" • Hadith "+fn,fp.isEmpty()?"Open Hadith":"Open Hadith • "+fp,()->openHadithSearchResult(fbi,fcid,fn)));found++;if(found>=30)break outer;}
                        }
                    }catch(Exception ignored){}
                }
                final int total=found;runOnUiThread(()->l.setText(total==0?"No Hadith found.":total+" result(s) shown."));
            }).start();
        });
        TextView back=text("‹  Back to Hadith",16,green,true);back.setPadding(22,18,22,18);back.setOnClickListener(v->showHadith());content.addView(back);
    }

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
    private JSONObject getJson(String url) throws Exception{