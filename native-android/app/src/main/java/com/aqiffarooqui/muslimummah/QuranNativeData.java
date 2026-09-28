package com.aqiffarooqui.muslimummah;

import android.content.Context;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.*;

public final class QuranNativeData {
    public static final String ARABIC_URL="https://raw.githubusercontent.com/aqiffarooqui-dot/muslim-ummah/main/src/data/quran-uthmani.txt";
    public static final String URDU_URL="https://raw.githubusercontent.com/druvx13/Quran-data/cairo/data/ur.jalandhry.txt";
    public static final String HINGLISH_URL="https://raw.githubusercontent.com/druvx13/Quran-data/cairo/data/ur.romanmaududi.txt";
    public static final String ENGLISH_URL="https://raw.githubusercontent.com/druvx13/Quran-data/cairo/data/en.sahih.txt";

    public static class Ayah {
        public final int surah, number; public final String text;
        public Ayah(int s,int n,String t){surah=s;number=n;text=t;}
    }

    public static void load(Context ctx, int surah, String lang, Callback cb){
        new Thread(() -> {
            try {
                String fileName="quran_"+lang+".txt";
                File cache=new File(ctx.getFilesDir(),fileName);
                String raw;
                try {
                    raw=readAsset(ctx,"quran/quran_"+lang+".txt");
                    if(!cache.exists()) write(cache,raw);
                } catch(Exception assetError) {
                    raw=cache.exists()?read(cache):download(urlFor(lang));
                    if(!cache.exists()) write(cache,raw);
                }
                List<Ayah> all=parse(raw,lang);
                List<Ayah> out=new ArrayList<>();
                for(Ayah a:all) if(a.surah==surah) out.add(a);
                if(out.isEmpty()) throw new IOException("No Ayahs found for Surah "+surah);
                cb.done(out,null);
            } catch(Exception e){cb.done(Collections.emptyList(),e);}
        }).start();
    }

    private static String urlFor(String lang){
        if("urdu".equals(lang)) return URDU_URL;
        if("hinglish".equals(lang)) return HINGLISH_URL;
        if("english".equals(lang)) return ENGLISH_URL;
        return ARABIC_URL;
    }

    private static List<Ayah> parse(String raw,String lang){
        List<Ayah> out=new ArrayList<>();
        String[] lines=raw.replace("\r","").split("\n");
        boolean keyed=false;
        for(String line:lines) if(line.split("\\|",-1).length>=3){keyed=true;break;}
        if(keyed){
            for(String line:lines){
                String[] p=line.trim().split("\\|",-1);
                if(p.length<3) continue;
                try{int s=Integer.parseInt(p[0].trim()),n=Integer.parseInt(p[1].trim());String t=join(p,2).trim();if(!t.isEmpty())out.add(new Ayah(s,n,t));}catch(Exception ignored){}
            }
        } else {
            int index=0;
            for(QuranData.Surah s:QuranData.SURAHS) for(int n=1;n<=s.ayahCount;n++){
                if(index>=lines.length) break;
                String t=lines[index++].trim();
                if(!t.isEmpty()) out.add(new Ayah(s.number,n,t));
            }
        }
        return out;
    }

    private static String join(String[] p,int from){StringBuilder b=new StringBuilder();for(int i=from;i<p.length;i++){if(i>from)b.append('|');b.append(p[i]);}return b.toString();}
    private static String download(String u)throws Exception{
        HttpURLConnection c=(HttpURLConnection)new URL(u).openConnection();c.setConnectTimeout(10000);c.setReadTimeout(20000);
        try(BufferedReader r=new BufferedReader(new InputStreamReader(c.getInputStream(),"UTF-8"))){StringBuilder b=new StringBuilder();String l;while((l=r.readLine())!=null)b.append(l).append('\n');return b.toString();}finally{c.disconnect();}
    }
    private static String readAsset(Context ctx,String path)throws Exception{
        StringBuilder b=new StringBuilder();
        try(BufferedReader r=new BufferedReader(new InputStreamReader(ctx.getAssets().open(path),"UTF-8"))){
            String l; while((l=r.readLine())!=null)b.append(l).append('\\n');
        }
        return b.toString();
    }
    private static String read(File f)throws Exception{StringBuilder b=new StringBuilder();try(BufferedReader r=new BufferedReader(new InputStreamReader(new FileInputStream(f),"UTF-8"))){String l;while((l=r.readLine())!=null)b.append(l).append('\n');}return b.toString();}
    private static void write(File f,String s)throws Exception{try(Writer w=new OutputStreamWriter(new FileOutputStream(f),"UTF-8")){w.write(s);}}
    public interface Callback{void done(List<Ayah> ayahs,Exception error);}
}
