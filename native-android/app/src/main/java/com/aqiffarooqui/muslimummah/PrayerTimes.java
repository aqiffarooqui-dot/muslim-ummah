package com.aqiffarooqui.muslimummah;

import java.util.Calendar;
import java.util.Date;
import java.util.TimeZone;

public final class PrayerTimes {
    public static final class Result {
        public final String fajr, dhuhr, asr, maghrib, isha;
        public Result(String fajr,String dhuhr,String asr,String maghrib,String isha){
            this.fajr=fajr;this.dhuhr=dhuhr;this.asr=asr;this.maghrib=maghrib;this.isha=isha;
        }
    }
    private PrayerTimes(){}

    public static Result calculate(double lat,double lon,Date date,String method){
        double fajrAngle=18.0,ishaAngle=17.0;
        if(method!=null){
            if(method.startsWith("ISNA")){fajrAngle=15;ishaAngle=15;}
            else if(method.startsWith("Egyptian")){fajrAngle=19.5;ishaAngle=17.5;}
            else if(method.startsWith("Karachi")){fajrAngle=18;ishaAngle=18;}
            else if(method.startsWith("Umm")){fajrAngle=18.5;ishaAngle=90;}
        }
        Calendar cal=Calendar.getInstance();
        cal.setTime(date);
        int day=cal.get(Calendar.DAY_OF_YEAR);
        double decl=23.45*Math.sin(Math.toRadians(360.0*(284+day)/365.0));
        double b=2*Math.PI*(day-81)/364.0;
        double eot=9.87*Math.sin(2*b)-7.53*Math.cos(b)-1.5*Math.sin(b);
        double tz=cal.getTimeZone().getOffset(date.getTime())/3600000.0;
        double solarNoon=12.0+tz-lon/15.0-eot/60.0;
        double noon=solarNoon;

        double sunrise=sunAngleTime(-0.833,lat,decl,solarNoon,true);
        double sunset=sunAngleTime(-0.833,lat,decl,solarNoon,false);
        double fajr=sunAngleTime(-fajrAngle,lat,decl,solarNoon,true);
        double isha=ishaAngle==90 ? sunset+1.5 : sunAngleTime(-ishaAngle,lat,decl,solarNoon,false);
        double asr=asrTime(lat,decl,solarNoon);
        return new Result(fmt(fajr),fmt(noon),fmt(asr),fmt(sunset),fmt(isha));
    }

    private static double sunAngleTime(double angle,double lat,double decl,double noon,boolean morning){
        double cosH=(Math.sin(Math.toRadians(angle))-Math.sin(Math.toRadians(lat))*Math.sin(Math.toRadians(decl)))/
                (Math.cos(Math.toRadians(lat))*Math.cos(Math.toRadians(decl)));
        if(cosH>1)return Double.NaN;
        if(cosH<-1)return Double.NaN;
        double h=Math.toDegrees(Math.acos(cosH))/15.0;
        return noon+(morning?-h:h);
    }
    private static double asrTime(double lat,double decl,double noon){
        double angle=Math.toDegrees(Math.atan(1.0/(1.0+Math.tan(Math.toRadians(Math.abs(lat-decl))))));
        double cosH=(Math.sin(Math.toRadians(angle))-Math.sin(Math.toRadians(lat))*Math.sin(Math.toRadians(decl)))/
                (Math.cos(Math.toRadians(lat))*Math.cos(Math.toRadians(decl)));
        if(cosH>1||cosH<-1)return Double.NaN;
        return noon+Math.toDegrees(Math.acos(cosH))/15.0;
    }
    private static String fmt(double hours){
        if(Double.isNaN(hours))return "--:--";
        hours=(hours%24+24)%24;
        int h=(int)hours, m=(int)Math.round((hours-h)*60);
        if(m==60){h=(h+1)%24;m=0;}
        return String.format(java.util.Locale.getDefault(),"%02d:%02d",h,m);
    }
}
