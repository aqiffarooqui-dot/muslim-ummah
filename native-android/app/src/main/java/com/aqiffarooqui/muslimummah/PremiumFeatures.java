package com.aqiffarooqui.muslimummah;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/** Single source of truth for Premium feature identifiers shown by the native app. */
public final class PremiumFeatures {
    private PremiumFeatures() {}

    public static final String TRANSLATIONS = "translations";
    public static final String MULTIPLE_TRANSLATIONS = "multiple_translations";
    public static final String TAFSIR = "tafsir";
    public static final String WORD_BY_WORD = "word_by_word";
    public static final String ROOT_ANALYSIS = "root_analysis";
    public static final String ADVANCED_QURAN_SEARCH = "advanced_quran_search";
    public static final String QURAN_NOTES = "quran_notes";
    public static final String QURAN_FOLDERS = "quran_folders";
    public static final String KHATM_PLANNER = "khatm_planner";
    public static final String QURAN_GOALS = "quran_goals";

    public static final String MULTIPLE_QARIS = "multiple_qaris";
    public static final String VERSE_AUDIO = "verse_audio";
    public static final String AUDIO_REPEAT = "audio_repeat";
    public static final String BACKGROUND_AUDIO = "background_audio";
    public static final String OFFLINE_AUDIO = "offline_audio";
    public static final String SLEEP_REPEAT = "sleep_repeat";

    public static final String HADITH_TRANSLATIONS = "hadith_translations";
    public static final String ADVANCED_HADITH_SEARCH = "advanced_hadith_search";
    public static final String HADITH_COLLECTIONS = "hadith_collections";
    public static final String HADITH_NOTES = "hadith_notes";
    public static final String HADITH_HIGHLIGHTS = "hadith_highlights";
    public static final String RELATED_HADITH = "related_hadith";

    public static final String AI_QA = "ai_qa";
    public static final String AI_REFERENCES = "ai_references";
    public static final String AI_TOPIC_SEARCH = "ai_topic_search";

    public static final String THEMES = "themes";
    public static final String FONTS = "fonts";
    public static final String MUSHAF_STYLES = "mushaf_styles";
    public static final String ARABIC_FONT = "arabic_font";
    public static final String CUSTOM_HOME = "custom_home";
    public static final String PREMIUM_WALLPAPERS = "premium_wallpapers";
    public static final String AMOLED = "amoled";

    public static final String ADVANCED_PRAYER_NOTIFICATIONS = "advanced_prayer_notifications";
    public static final String CUSTOM_ADHAN = "custom_adhan";
    public static final String PRAYER_CALENDAR = "prayer_calendar";
    public static final String PRAYER_TRACKING = "prayer_tracking";
    public static final String MISSED_PRAYER = "missed_prayer";

    public static final String ADVANCED_QIBLA = "advanced_qibla";
    public static final String QIBLA_AR = "qibla_ar";
    public static final String MOSQUE_FINDER = "mosque_finder";
    public static final String TRAVEL_MODE = "travel_mode";

    public static final String DHIKR_LISTS = "dhikr_lists";
    public static final String DHIKR_GOALS = "dhikr_goals";
    public static final String STREAKS = "streaks";
    public static final String SPIRITUAL_STATS = "spiritual_stats";
    public static final String WORSHIP_DASHBOARD = "worship_dashboard";

    public static final String CLOUD_SYNC = "cloud_sync";
    public static final String SMART_REMINDERS = "smart_reminders";
    public static final String WIDGETS = "widgets";
    public static final String RAMADAN_MODE = "ramadan_mode";

    public static final List<String> ALL = Collections.unmodifiableList(Arrays.asList(
            TRANSLATIONS, MULTIPLE_TRANSLATIONS, TAFSIR, WORD_BY_WORD, ROOT_ANALYSIS,
            ADVANCED_QURAN_SEARCH, QURAN_NOTES, QURAN_FOLDERS, KHATM_PLANNER, QURAN_GOALS,
            MULTIPLE_QARIS, VERSE_AUDIO, AUDIO_REPEAT, BACKGROUND_AUDIO, OFFLINE_AUDIO, SLEEP_REPEAT,
            HADITH_TRANSLATIONS, ADVANCED_HADITH_SEARCH, HADITH_COLLECTIONS, HADITH_NOTES,
            HADITH_HIGHLIGHTS, RELATED_HADITH, AI_QA, AI_REFERENCES, AI_TOPIC_SEARCH,
            THEMES, FONTS, MUSHAF_STYLES, ARABIC_FONT, CUSTOM_HOME, PREMIUM_WALLPAPERS, AMOLED,
            ADVANCED_PRAYER_NOTIFICATIONS, CUSTOM_ADHAN, PRAYER_CALENDAR, PRAYER_TRACKING,
            MISSED_PRAYER, ADVANCED_QIBLA, QIBLA_AR, MOSQUE_FINDER, TRAVEL_MODE,
            DHIKR_LISTS, DHIKR_GOALS, STREAKS, SPIRITUAL_STATS, WORSHIP_DASHBOARD,
            CLOUD_SYNC, SMART_REMINDERS, WIDGETS, RAMADAN_MODE
    ));

    public static boolean requiresPremium(String feature) {
        return feature != null && ALL.contains(feature);
    }
}
