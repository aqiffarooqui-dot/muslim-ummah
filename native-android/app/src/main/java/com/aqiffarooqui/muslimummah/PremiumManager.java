package com.aqiffarooqui.muslimummah;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * Central Premium entitlement state.
 *
 * The cached state is only a continuity cache. It is never sufficient to
 * create a Premium entitlement by itself. A future server verification step
 * must call setVerifiedEntitlement() after validating the signed/server
 * response.
 */
public final class PremiumManager {
    private static final String PREFS = "premium_entitlement";
    private static final String KEY_ACTIVE = "active";
    private static final String KEY_UID = "uid";
    private static final String KEY_EXPIRES_AT = "expiresAt";
    private static final String KEY_VERIFIED_AT = "verifiedAt";
    private static final String KEY_PROOF = "proof";

    private PremiumManager() {}

    public static boolean isPremium(Context context) {
        SharedPreferences p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        return p.getBoolean(KEY_ACTIVE, false)
                && !isExpired(p.getLong(KEY_EXPIRES_AT, 0L));
    }

    public static String getUserId(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .getString(KEY_UID, "");
    }

    public static long getExpiresAt(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .getLong(KEY_EXPIRES_AT, 0L);
    }

    /**
     * Stores only an entitlement that has already been verified by the app's
     * trusted server path. Passing an arbitrary local flag is deliberately not
     * exposed.
     */
    public static void setVerifiedEntitlement(
            Context context,
            String uid,
            boolean active,
            long expiresAt,
            String serverProof
    ) {
        if (uid == null || uid.trim().isEmpty() || serverProof == null || serverProof.isEmpty()) {
            clear(context);
            return;
        }

        SharedPreferences.Editor e = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit();
        e.putBoolean(KEY_ACTIVE, active);
        e.putString(KEY_UID, uid.trim());
        e.putLong(KEY_EXPIRES_AT, expiresAt);
        e.putLong(KEY_VERIFIED_AT, System.currentTimeMillis());
        e.putString(KEY_PROOF, serverProof);
        e.apply();
    }

    public static void clear(Context context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().clear().apply();
    }

    public static boolean isExpired(long expiresAt) {
        return expiresAt > 0L && System.currentTimeMillis() >= expiresAt;
    }

    public static JSONObject toJson(Context context) {
        SharedPreferences p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        JSONObject o = new JSONObject();
        try {
            o.put("active", p.getBoolean(KEY_ACTIVE, false));
            o.put("uid", p.getString(KEY_UID, ""));
            o.put("expiresAt", p.getLong(KEY_EXPIRES_AT, 0L));
            o.put("verifiedAt", p.getLong(KEY_VERIFIED_AT, 0L));
        } catch (Exception ignored) {
        }
        return o;
    }
}
