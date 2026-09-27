package com.aqiffarooqui.muslimummah;

import android.annotation.SuppressLint;
import android.app.AlertDialog;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.appcompat.app.AppCompatActivity;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class MainActivity extends AppCompatActivity {

    private static final String APP_URL = "https://aqiffarooqui-dot.github.io/muslim-ummah/";
    private static final String UPDATE_URL = "https://aqiffarooqui-dot.github.io/muslim-ummah/update.json";
    private static final String CURRENT_VERSION = "1.0.0";

    private WebView webView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        setContentView(webView);

        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setDatabaseEnabled(true);
        webView.getSettings().setAllowFileAccess(false);
        webView.getSettings().setAllowContentAccess(false);
        webView.getSettings().setBuiltInZoomControls(false);
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("http".equals(uri.getScheme()) || "https".equals(uri.getScheme())) {
                    if (uri.toString().startsWith(APP_URL)) {
                        return false;
                    }
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                    return true;
                }
                return false;
            }
        });

        webView.loadUrl(APP_URL);
        checkForUpdate();
    }

    private void checkForUpdate() {
        new Thread(() -> {
            HttpURLConnection connection = null;
            try {
                URL url = new URL(UPDATE_URL);
                connection = (HttpURLConnection) url.openConnection();
                connection.setConnectTimeout(5000);
                connection.setReadTimeout(5000);
                connection.setRequestMethod("GET");

                BufferedReader reader = new BufferedReader(
                        new InputStreamReader(connection.getInputStream())
                );

                StringBuilder body = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    body.append(line);
                }
                reader.close();

                JSONObject data = new JSONObject(body.toString());
                String latestVersion = data.optString("version", CURRENT_VERSION);

                if (isNewerVersion(latestVersion, CURRENT_VERSION)) {
                    JSONArray changes = data.optJSONArray("changes");
                    StringBuilder message = new StringBuilder();

                    if (changes != null) {
                        for (int i = 0; i < changes.length(); i++) {
                            message.append("• ")
                                   .append(changes.optString(i))
                                   .append("\n");
                        }
                    }

                    String apkUrl = data.optString("apkUrl", "");

                    runOnUiThread(() -> showUpdateDialog(
                            latestVersion,
                            message.toString().trim(),
                            apkUrl
                    ));
                }
            } catch (Exception ignored) {
                // Update checking must never prevent the app from opening.
            } finally {
                if (connection != null) {
                    connection.disconnect();
                }
            }
        }).start();
    }

    private boolean isNewerVersion(String latest, String current) {
        try {
            String[] a = latest.replace("v", "").split("\\.");
            String[] b = current.replace("v", "").split("\\.");

            int max = Math.max(a.length, b.length);
            for (int i = 0; i < max; i++) {
                int ai = i < a.length ? Integer.parseInt(a[i]) : 0;
                int bi = i < b.length ? Integer.parseInt(b[i]) : 0;

                if (ai > bi) return true;
                if (ai < bi) return false;
            }
        } catch (Exception ignored) {
        }
        return false;
    }

    private void showUpdateDialog(String version, String changes, String apkUrl) {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Muslim Ummah Update Available");
        builder.setMessage("Version " + version + "\n\nWhat's New:\n" +
                (changes.isEmpty() ? "New improvements and fixes." : changes));

        builder.setPositiveButton("Update Now", (dialog, which) -> {
            if (!apkUrl.isEmpty()) {
                startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(apkUrl)));
            } else {
                webView.reload();
            }
        });

        builder.setNegativeButton("Later", null);
        builder.setCancelable(true);
        builder.show();
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
