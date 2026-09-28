package com.aqiffarooqui.muslimummah;

import android.content.Context;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;

public final class FirebaseManager {
    private static final String PROJECT_ID = "muslim-ummah-d970c";
    private static final String APPLICATION_ID = "1:518938483883:web:97f907714aa09be8ee2bee";
    private static final String API_KEY = "REPLACE_WITH_FIREBASE_WEB_API_KEY";
    private static FirebaseAuth auth;

    private FirebaseManager(){}

    public static synchronized FirebaseAuth auth(Context context){
        try{
            if(auth!=null)return auth;
            FirebaseApp app;
            try{ app=FirebaseApp.getInstance(); }
            catch(Exception ignored){
                FirebaseOptions options=new FirebaseOptions.Builder()
                        .setProjectId(PROJECT_ID).setApplicationId(APPLICATION_ID).setApiKey(API_KEY).build();
                app=FirebaseApp.initializeApp(context.getApplicationContext(),options);
            }
            if(app==null)return null;
            auth=FirebaseAuth.getInstance(app);
            return auth;
        }catch(Exception ignored){return null;}
    }

    public static FirebaseUser currentUser(Context context){
        FirebaseAuth a=auth(context); return a==null?null:a.getCurrentUser();
    }

    public static void signOut(Context context){
        FirebaseAuth a=auth(context); if(a!=null)a.signOut();
        PremiumManager.clear(context);
    }

    public static void refreshPremiumClaim(Context context,Runnable done){
        FirebaseUser user=currentUser(context);
        if(user==null){PremiumManager.clear(context);if(done!=null)done.run();return;}
        user.getIdToken(true).addOnCompleteListener(task->{
            if(task.isSuccessful()&&task.getResult()!=null){
                java.util.Map<String,Object> claims=task.getResult().getClaims();
                Object active=claims.get("premium");
                Object expires=claims.get("premiumExpiresAt");
                boolean isActive=active instanceof Boolean&&(Boolean)active;
                long expiresAt=expires instanceof Number?((Number)expires).longValue():0L;
                if(isActive&&!PremiumManager.isExpired(expiresAt))
                    PremiumManager.setVerifiedEntitlement(context,user.getUid(),true,expiresAt,task.getResult().getToken());
                else PremiumManager.clear(context);
            }
            if(done!=null)done.run();
        });
    }
}