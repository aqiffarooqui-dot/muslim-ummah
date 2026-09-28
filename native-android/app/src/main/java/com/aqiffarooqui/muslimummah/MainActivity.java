package com.aqiffarooqui.muslimummah;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.Settings;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class MainActivity extends Activity {

    private static final String APP_URL = "file:///android_asset/web/index.html";
    private static final String UPDATE_URL = "https://aqiffarooqui-dot.github.io/muslim-ummah/update.json";
    private static final String CURRENT_VERSION = "1.0.3";

    private WebView webView;
    private BroadcastReceiver downloadReceiver;
    private long downloadId = -1L;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        setContentView(webView);

        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setDatabaseEnabled(true);
        webView.getSettings().setAllowFileAccess(true);
        webView.getSettings().setAllowContentAccess(true);
        webView.getSettings().setBuiltInZoomControls(false);
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("http".equals(uri.getScheme()) || "https".equals(uri.getScheme())) {
                    if (uri.toString().startsWith("file:///android_asset/")) {
                        return false;
                    }
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                    return true;
                }
                return false;
            }
        });

        registerDownloadReceiver();
        webView.loadUrl(APP_URL);
        checkForUpdate();
    }

    private void registerDownloadReceiver() {
        downloadReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L);
                if (id != downloadId) return;

                DownloadManager manager =
                        (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                if (manager == null) return;

                DownloadManager.Query query = new DownloadManager.Query();
                query.setFilterById(downloadId);

                android.database.Cursor cursor = manager.query(query);
                if (cursor == null) return;

                try {
                    if (cursor.moveToFirst()) {
                        int status = cursor.getInt(
                                cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS)
                        );

                        if (status == DownloadManager.STATUS_SUCCESSFUL) {
                            String uriString = cursor.getString(
                                    cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_LOCAL_URI)
                            );
                            installDownloadedApk(Uri.parse(uriString));
                        } else {
                            showMessage("Update download failed. Please try again.");
                        }
                    }
                } finally {
                    cursor.close();
                }
            }
        };

        IntentFilter filter = new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(downloadReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(downloadReceiver, filter);
        }
    }

    private void checkForUpdate() {
        new Thread(() -> {
            HttpURLConnection connection = null;
            try {
                URL url = new URL(UPDATE_URL + "?t=" + System.currentTimeMillis());
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

        if (!apkUrl.isEmpty()) {
            builder.setPositiveButton("Update Now", (dialog, which) -> downloadAndInstall(apkUrl));
        }

        builder.setNegativeButton("Later", null);
        builder.setCancelable(true);
        builder.show();
    }

    private void downloadAndInstall(String apkUrl) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                && !getPackageManager().canRequestPackageInstalls()) {
            new AlertDialog.Builder(this)
                    .setTitle("Allow app updates")
                    .setMessage("Please allow Muslim Ummah to install updates, then tap Update again.")
                    .setPositiveButton("Open Settings", (dialog, which) -> {
                        Intent intent = new Intent(
                                Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                                Uri.parse("package:" + getPackageName())
                        );
                        startActivity(intent);
                    })
                    .setNegativeButton("Cancel", null)
                    .show();
            return;
        }

        DownloadManager manager = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
        if (manager == null) {
            showMessage("Download service is unavailable.");
            return;
        }

        try {
            Uri uri = Uri.parse(apkUrl);
            DownloadManager.Request request = new DownloadManager.Request(uri);
            request.setTitle("Muslim Ummah Update");
            request.setDescription("Downloading the latest Muslim Ummah update");
            request.setMimeType("application/vnd.android.package-archive");
            request.setNotificationVisibility(
                    DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED
            );
            request.setDestinationInExternalFilesDir(
                    this,
                    Environment.DIRECTORY_DOWNLOADS,
                    "muslim-ummah-update.apk"
            );

            downloadId = manager.enqueue(request);
            showMessage("Update download started. Installation will open when ready.");
        } catch (Exception e) {
            showMessage("Could not start the update download.");
        }
    }

    private void installDownloadedApk(Uri apkUri) {
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivity(intent);
        } catch (Exception e) {
            showMessage("The APK downloaded, but Android could not open the installer.");
        }
    }

    private void showMessage(String message) {
        runOnUiThread(() ->
                new AlertDialog.Builder(this)
                        .setMessage(message)
                        .setPositiveButton("OK", null)
                        .show()
        );
    }

    @Override
    protected void onDestroy() {
        if (downloadReceiver != null) {
            try {
                unregisterReceiver(downloadReceiver);
            } catch (Exception ignored) {
            }
        }
        super.onDestroy();
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
