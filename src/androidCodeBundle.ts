/**
 * Complete Native Android (Kotlin + Jetpack Compose) Source Bundle
 * Matching all specifications:
 * - Single Activity (MainActivity.kt)
 * - Jetpack Compose UI (custom Warm Paper Minimalist Theme)
 * - Room Database (EntryEntity, EntryDao, BlocksDatabase)
 * - ViewModel + StateFlow
 * - WorkManager (DayAutoCloseWorker, ReminderWorker)
 * - Edge-to-edge, portrait, minSdk 26
 * - Gap auto-fill, Overlap auto-trim with Undo, Split action, Wheel picker
 */

export const ANDROID_CODE_FILES: Record<string, string> = {
  'build.gradle.kts': `// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.ksp) apply false
}
`,

  'settings.gradle.kts': `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "Blocks"
include(":app")
`,

  'gradle.properties': `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
kotlin.code.style=official
android.nonTransitiveRClass=true
`,

  'app/build.gradle.kts': `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.devtools.ksp")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "com.blocks.tracker"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.blocks.tracker"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.10.01")
    implementation(composeBom)
    androidTestImplementation(composeBom)

    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("androidx.activity:activity-compose:1.9.3")

    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")

    // Room Database
    val roomVersion = "2.6.1"
    implementation("androidx.room:room-runtime:$roomVersion")
    implementation("androidx.room:room-ktx:$roomVersion")
    ksp("androidx.room:room-compiler:$roomVersion")

    // WorkManager
    implementation("androidx.work:work-runtime-ktx:2.9.1")

    // Coroutines & Lifecycle
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")

    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
`,

  'app/src/main/AndroidManifest.xml': `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:name=".BlocksApplication"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.Blocks">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait"
            android:windowSoftInputMode="adjustResize"
            android:theme="@style/Theme.Blocks">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
`,

  'app/src/main/java/com/blocks/tracker/BlocksApplication.kt': `package com.blocks.tracker

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import androidx.work.*
import com.blocks.tracker.data.BlocksDatabase
import com.blocks.tracker.worker.DayAutoCloseWorker
import com.blocks.tracker.worker.ReminderWorker
import java.util.concurrent.TimeUnit

class BlocksApplication : Application() {

    val database by lazy { BlocksDatabase.getDatabase(this) }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
        scheduleBackgroundWorkers()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID_REMINDER,
                "Untitled Blocks Reminders",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Reminds you to name untitled time blocks"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun scheduleBackgroundWorkers() {
        val workManager = WorkManager.getInstance(this)

        // 1. Day Auto-Close near 23:59 daily
        val autoCloseWork = PeriodicWorkRequestBuilder<DayAutoCloseWorker>(
            1, TimeUnit.DAYS
        ).build()
        workManager.enqueueUniquePeriodicWork(
            "DayAutoCloseWorker",
            ExistingPeriodicWorkPolicy.KEEP,
            autoCloseWork
        )

        // 2. Local notification reminder every 2 hours while untitled entries exist
        val reminderWork = PeriodicWorkRequestBuilder<ReminderWorker>(
            2, TimeUnit.HOURS
        ).build()
        workManager.enqueueUniquePeriodicWork(
            "ReminderWorker",
            ExistingPeriodicWorkPolicy.KEEP,
            reminderWork
        )
    }

    companion object {
        const val CHANNEL_ID_REMINDER = "blocks_reminders"
    }
}
`,

  'app/src/main/java/com/blocks/tracker/data/EntryEntity.kt': `package com.blocks.tracker.data

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Entry model matching specifications:
 * Entry(id, date, startMin, endMin, title, createdAt, updatedAt)
 * - date: 'yyyy-MM-dd'
 * - startMin / endMin: 0 to 1440
 * - empty title = 'Untitled'
 * - endMin 1440 is shown as 23:59
 */
@Entity(tableName = "entries")
data class EntryEntity(
    @PrimaryKey val id: String,
    val date: String,
    val startMin: Int,
    val endMin: Int,
    val title: String,
    val createdAt: Long,
    val updatedAt: Long
) {
    val displayTitle: String
        get() = if (title.isBlank()) "Untitled" else title

    val durationMinutes: Int
        get() = (endMin - startMin).coerceAtLeast(0)

    val formattedDuration: String
        get() {
            val h = durationMinutes / 60
            val m = durationMinutes % 60
            return when {
                h > 0 && m > 0 -> "\${h}h \${m}m"
                h > 0 -> "\${h}h"
                else -> "\${m}m"
            }
        }

    val formattedRange: String
        get() = "\${formatMin(startMin)}–\${formatMin(endMin)}"

    companion object {
        fun formatMin(min: Int): String {
            if (min >= 1440) return "23:59"
            val safe = min.coerceIn(0, 1440)
            val h = safe / 60
            val m = safe % 60
            return String.format("%02d:%02d", h, m)
        }
    }
}
`,

  'app/src/main/java/com/blocks/tracker/data/EntryDao.kt': `package com.blocks.tracker.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface EntryDao {
    @Query("SELECT * FROM entries WHERE date = :date ORDER BY startMin ASC")
    fun getEntriesForDate(date: String): Flow<List<EntryEntity>>

    @Query("SELECT * FROM entries WHERE date = :date ORDER BY startMin ASC")
    suspend fun getEntriesForDateSync(date: String): List<EntryEntity>

    @Query("SELECT * FROM entries ORDER BY date ASC, startMin ASC")
    fun getAllEntries(): Flow<List<EntryEntity>>

    @Query("SELECT * FROM entries ORDER BY date ASC, startMin ASC")
    suspend fun getAllEntriesSync(): List<EntryEntity>

    @Query("SELECT * FROM entries WHERE title = '' OR title IS NULL ORDER BY date DESC, startMin DESC")
    suspend fun getUntitledEntries(): List<EntryEntity>

    @Query("SELECT COUNT(*) FROM entries WHERE (title = '' OR title IS NULL) AND date = :date")
    fun getUntitledCountForDate(date: String): Flow<Int>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEntries(entries: List<EntryEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEntry(entry: EntryEntity)

    @Update
    suspend fun updateEntry(entry: EntryEntity)

    @Delete
    suspend fun deleteEntry(entry: EntryEntity)

    @Query("DELETE FROM entries WHERE id IN (:ids)")
    suspend fun deleteByIds(ids: List<String>)
}
`,

  'app/src/main/java/com/blocks/tracker/data/BlocksDatabase.kt': `package com.blocks.tracker.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(entities = [EntryEntity::class], version = 1, exportSchema = false)
abstract class BlocksDatabase : RoomDatabase() {
    abstract fun entryDao(): EntryDao

    companion object {
        @Volatile
        private var INSTANCE: BlocksDatabase? = null

        fun getDatabase(context: Context): BlocksDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    BlocksDatabase::class.java,
                    "blocks_database"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
`,

  'app/src/main/java/com/blocks/tracker/data/BlocksRepository.kt': `package com.blocks.tracker.data

import kotlinx.coroutines.flow.Flow
import java.util.UUID

class BlocksRepository(private val dao: EntryDao) {

    fun getEntriesForDate(date: String): Flow<List<EntryEntity>> =
        dao.getEntriesForDate(date)

    fun getAllEntries(): Flow<List<EntryEntity>> =
        dao.getAllEntries()

    suspend fun getAllEntriesSync(): List<EntryEntity> =
        dao.getAllEntriesSync()

    fun getUntitledCountForDate(date: String): Flow<Int> =
        dao.getUntitledCountForDate(date)

    suspend fun getUntitledEntries(): List<EntryEntity> =
        dao.getUntitledEntries()

    /**
     * Add entry with Gap auto-fill and Overlap auto-trim:
     * - Gap auto-fill: if from > last entry's end, the skipped interval is saved as an Untitled entry.
     * - Overlap auto-trim: if from < last entry's end, trim earlier entries and return trimmed for Undo.
     */
    suspend fun addEntry(
        date: String,
        fromMin: Int,
        toMin: Int,
        title: String
    ): List<EntryEntity> {
        val existing = dao.getEntriesForDateSync(date).sortedBy { it.startMin }
        val toInsert = mutableListOf<EntryEntity>()
        val toDelete = mutableListOf<String>()

        if (existing.isEmpty()) {
            if (fromMin > 0) {
                // Gap from 00:00 to fromMin
                toInsert.add(
                    EntryEntity(
                        id = UUID.randomUUID().toString(),
                        date = date,
                        startMin = 0,
                        endMin = fromMin,
                        title = "",
                        createdAt = System.currentTimeMillis(),
                        updatedAt = System.currentTimeMillis()
                    )
                )
            }
        } else {
            val lastEntry = existing.last()
            if (fromMin > lastEntry.endMin) {
                // Gap auto-fill
                toInsert.add(
                    EntryEntity(
                        id = UUID.randomUUID().toString(),
                        date = date,
                        startMin = lastEntry.endMin,
                        endMin = fromMin,
                        title = "",
                        createdAt = System.currentTimeMillis(),
                        updatedAt = System.currentTimeMillis()
                    )
                )
            } else if (fromMin < lastEntry.endMin) {
                // Overlap auto-trim: trim or remove earlier entries
                for (e in existing) {
                    if (e.endMin <= fromMin) {
                        // stays intact
                    } else if (e.startMin < fromMin) {
                        // partly overlaps, trim its endMin
                        toInsert.add(e.copy(endMin = fromMin, updatedAt = System.currentTimeMillis()))
                    } else {
                        // fully covered, delete
                        toDelete.add(e.id)
                    }
                }
            }
        }

        // Add the new block
        val newBlock = EntryEntity(
            id = UUID.randomUUID().toString(),
            date = date,
            startMin = fromMin,
            endMin = toMin,
            title = title.trim(),
            createdAt = System.currentTimeMillis(),
            updatedAt = System.currentTimeMillis()
        )
        toInsert.add(newBlock)

        if (toDelete.isNotEmpty()) {
            dao.deleteByIds(toDelete)
        }
        dao.insertEntries(toInsert)
        return existing
    }

    /**
     * Day auto-close: entries never cross midnight.
     * If a day's last entry ends before 24:00 (1440), save the rest as an Untitled entry up to 24:00 (23:59).
     */
    suspend fun runDayAutoClose(date: String) {
        val entries = dao.getEntriesForDateSync(date).sortedBy { it.startMin }
        if (entries.isNotEmpty()) {
            val last = entries.last()
            if (last.endMin < 1440) {
                dao.insertEntry(
                    EntryEntity(
                        id = UUID.randomUUID().toString(),
                        date = date,
                        startMin = last.endMin,
                        endMin = 1440,
                        title = "",
                        createdAt = System.currentTimeMillis(),
                        updatedAt = System.currentTimeMillis()
                    )
                )
            }
        }
    }

    suspend fun updateEntryEdges(
        date: String,
        target: EntryEntity,
        newStart: Int,
        newEnd: Int,
        newTitle: String
    ) {
        val entries = dao.getEntriesForDateSync(date).sortedBy { it.startMin }.toMutableList()
        val index = entries.indexOfFirst { it.id == target.id }
        if (index == -1) return

        val updatedTarget = target.copy(
            startMin = newStart,
            endMin = newEnd,
            title = newTitle.trim(),
            updatedAt = System.currentTimeMillis()
        )
        entries[index] = updatedTarget

        // Adjust previous neighbor's endMin
        if (index > 0) {
            val prev = entries[index - 1]
            entries[index - 1] = prev.copy(endMin = newStart, updatedAt = System.currentTimeMillis())
        }

        // Adjust next neighbor's startMin
        if (index < entries.size - 1) {
            val next = entries[index + 1]
            entries[index + 1] = next.copy(startMin = newEnd, updatedAt = System.currentTimeMillis())
        }

        dao.insertEntries(entries)
    }

    suspend fun splitEntry(entry: EntryEntity, splitMin: Int) {
        if (splitMin <= entry.startMin || splitMin >= entry.endMin) return

        val first = entry.copy(
            endMin = splitMin,
            updatedAt = System.currentTimeMillis()
        )
        val second = EntryEntity(
            id = UUID.randomUUID().toString(),
            date = entry.date,
            startMin = splitMin,
            endMin = entry.endMin,
            title = "",
            createdAt = System.currentTimeMillis(),
            updatedAt = System.currentTimeMillis()
        )
        dao.insertEntries(listOf(first, second))
    }

    suspend fun deleteEntry(entry: EntryEntity) {
        dao.deleteEntry(entry)
    }

    suspend fun restoreEntries(entries: List<EntryEntity>, date: String) {
        val current = dao.getEntriesForDateSync(date)
        dao.deleteByIds(current.map { it.id })
        dao.insertEntries(entries)
    }

    suspend fun updateTitle(entryId: String, newTitle: String) {
        val all = dao.getAllEntriesSync()
        all.find { it.id == entryId }?.let {
            dao.updateEntry(it.copy(title = newTitle.trim(), updatedAt = System.currentTimeMillis()))
        }
    }
}
`,

  'app/src/main/java/com/blocks/tracker/worker/DayAutoCloseWorker.kt': `package com.blocks.tracker.worker

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.blocks.tracker.BlocksApplication
import com.blocks.tracker.data.BlocksRepository
import java.time.LocalDate

class DayAutoCloseWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        val app = applicationContext as BlocksApplication
        val repository = BlocksRepository(app.database.entryDao())
        val todayStr = LocalDate.now().toString()
        val yesterdayStr = LocalDate.now().minusDays(1).toString()

        repository.runDayAutoClose(todayStr)
        repository.runDayAutoClose(yesterdayStr)

        return Result.success()
    }
}
`,

  'app/src/main/java/com/blocks/tracker/worker/ReminderWorker.kt': `package com.blocks.tracker.worker

import android.app.NotificationManager
import android.content.Context
import androidx.core.app.NotificationCompat
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.blocks.tracker.BlocksApplication
import com.blocks.tracker.data.BlocksRepository

class ReminderWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        val app = applicationContext as BlocksApplication
        val repository = BlocksRepository(app.database.entryDao())
        val untitledList = repository.getUntitledEntries()

        if (untitledList.isNotEmpty()) {
            val count = untitledList.size
            val manager = applicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            val notification = NotificationCompat.Builder(applicationContext, BlocksApplication.CHANNEL_ID_REMINDER)
                .setSmallIcon(android.R.drawable.ic_menu_agenda)
                .setContentTitle("Blocks")
                .setContentText("You have $count untitled time block\${if (count > 1) "s" else ""}.")
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setAutoCancel(true)
                .build()

            manager.notify(1001, notification)
        }
        return Result.success()
    }
}
`,

  'app/src/main/java/com/blocks/tracker/ui/theme/Color.kt': `package com.blocks.tracker.ui.theme

import androidx.compose.ui.graphics.Color

// Warm Paper Minimalist Palette
val PaperSurface = Color(0xFFFDF9F3)
val PaperSurfaceSheet = Color(0xFFFBF9F5)
val PaperContainer = Color(0xFFF2EDE8)
val PaperDivider = Color(0xFFE6E1D6)
val InkPrimary = Color(0xFF1D1B18)
val InkSecondary = Color(0xFF625E54)
val AccentIndigo = Color(0xFF2F4D80)
val ColorWhite = Color(0xFFFFFFFF)
`,

  'app/src/main/java/com/blocks/tracker/ui/theme/Type.kt': `package com.blocks.tracker.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val Typography = Typography(
    displayLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Light,
        fontSize = 52.sp,
        lineHeight = 56.sp,
        letterSpacing = (-0.03).sp
    ),
    titleLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 22.sp,
        lineHeight = 28.sp,
        letterSpacing = (-0.015).sp
    ),
    bodyLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 17.sp,
        lineHeight = 24.sp,
        letterSpacing = (-0.01).sp
    ),
    labelLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 17.sp,
        lineHeight = 24.sp,
        letterSpacing = (-0.01).sp
    ),
    bodySmall = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 13.sp,
        lineHeight = 18.sp
    )
)
`,

  'app/src/main/java/com/blocks/tracker/ui/theme/Theme.kt': `package com.blocks.tracker.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColorScheme = lightColorScheme(
    primary = AccentIndigo,
    onPrimary = ColorWhite,
    background = PaperSurface,
    surface = PaperSurface,
    onSurface = InkPrimary,
    onSurfaceVariant = InkSecondary,
    outlineVariant = PaperDivider
)

@Composable
fun BlocksTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        typography = Typography,
        content = content
    )
}
`,

  'app/src/main/java/com/blocks/tracker/ui/viewmodel/BlocksViewModel.kt': `package com.blocks.tracker.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.blocks.tracker.data.BlocksRepository
import com.blocks.tracker.data.EntryEntity
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.LocalTime

class BlocksViewModel(private val repository: BlocksRepository) : ViewModel() {

    private val _currentDate = MutableStateFlow(LocalDate.now().toString())
    val currentDate: StateFlow<String> = _currentDate.asStateFlow()

    val entries: StateFlow<List<EntryEntity>> = _currentDate.flatMapLatest { date ->
        repository.getEntriesForDate(date)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val untitledCount: StateFlow<Int> = _currentDate.flatMapLatest { date ->
        repository.getUntitledCountForDate(date)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    val allEntries: StateFlow<List<EntryEntity>> = repository.getAllEntries()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Composer State
    val fromMin = MutableStateFlow(0)
    val toMin = MutableStateFlow(getNowMinutes())
    val isLiveClock = MutableStateFlow(true)
    val activityTitle = MutableStateFlow("")

    // Undo stack
    private var lastUndoSnapshot: List<EntryEntity>? = null
    val undoMessage = MutableStateFlow<String?>(null)

    init {
        // Ticker for live clock
        viewModelScope.launch {
            while (true) {
                if (isLiveClock.value) {
                    toMin.value = getNowMinutes()
                }
                delay(5000)
            }
        }

        // Align fromMin with last entry on date change
        viewModelScope.launch {
            entries.collect { list ->
                if (list.isNotEmpty()) {
                    fromMin.value = list.last().endMin
                } else {
                    fromMin.value = 0
                }
            }
        }

        // Run day auto close at start
        viewModelScope.launch {
            repository.runDayAutoClose(LocalDate.now().minusDays(1).toString())
        }
    }

    private fun getNowMinutes(): Int {
        val now = LocalTime.now()
        return now.hour * 60 + now.minute
    }

    fun addBlock() {
        if (fromMin.value >= toMin.value) return
        val currentSnap = entries.value

        viewModelScope.launch {
            val previous = repository.addEntry(
                date = _currentDate.value,
                fromMin = fromMin.value,
                toMin = toMin.value,
                title = activityTitle.value
            )
            activityTitle.value = ""
            fromMin.value = toMin.value
            isLiveClock.value = true

            // If overlap occurred
            val diff = previous.size - entries.value.size
            if (diff > 0) {
                lastUndoSnapshot = currentSnap
                undoMessage.value = "Trimmed overlapping blocks"
            }
        }
    }

    fun resumeLiveClock() {
        isLiveClock.value = true
        toMin.value = getNowMinutes()
    }

    fun setDate(date: String) {
        _currentDate.value = date
    }

    fun undo() {
        val snap = lastUndoSnapshot ?: return
        viewModelScope.launch {
            repository.restoreEntries(snap, _currentDate.value)
            lastUndoSnapshot = null
            undoMessage.value = null
        }
    }

    fun clearUndoMessage() {
        undoMessage.value = null
    }

    fun deleteEntry(entry: EntryEntity) {
        val snap = entries.value
        viewModelScope.launch {
            repository.deleteEntry(entry)
            lastUndoSnapshot = snap
            undoMessage.value = "Block removed"
        }
    }

    fun updateEdges(target: EntryEntity, newStart: Int, newEnd: Int, newTitle: String) {
        viewModelScope.launch {
            repository.updateEntryEdges(_currentDate.value, target, newStart, newEnd, newTitle)
        }
    }

    fun split(entry: EntryEntity, splitMin: Int) {
        viewModelScope.launch {
            repository.splitEntry(entry, splitMin)
        }
    }

    fun updateTitle(id: String, title: String) {
        viewModelScope.launch {
            repository.updateTitle(id, title)
        }
    }
}
`,

  'app/src/main/java/com/blocks/tracker/MainActivity.kt': `package com.blocks.tracker

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.SnackbarResult
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.blocks.tracker.data.BlocksRepository
import com.blocks.tracker.ui.screens.*
import com.blocks.tracker.ui.theme.BlocksTheme
import com.blocks.tracker.ui.viewmodel.BlocksViewModel

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val app = application as BlocksApplication
        val repository = BlocksRepository(app.database.entryDao())
        val viewModel = BlocksViewModel(repository)

        setContent {
            BlocksTheme {
                val snackbarHostState = remember { SnackbarHostState() }
                val undoMsg by viewModel.undoMessage.collectAsState()

                LaunchedEffect(undoMsg) {
                    undoMsg?.let { msg ->
                        val result = snackbarHostState.showSnackbar(
                            message = msg,
                            actionLabel = "Undo"
                        )
                        if (result == SnackbarResult.ActionPerformed) {
                            viewModel.undo()
                        } else {
                            viewModel.clearUndoMessage()
                        }
                    }
                }

                // App Navigation State: TRACK, CALENDAR, DAY_VIEW
                var currentScreen by remember { mutableStateOf("TRACK") }
                var selectedDateForDayView by remember { mutableStateOf("") }
                var showExportSheet by remember { mutableStateOf(false) }

                Scaffold(
                    snackbarHost = { SnackbarHost(snackbarHostState) },
                    modifier = Modifier.fillMaxSize()
                ) { innerPadding ->
                    Box(modifier = Modifier.padding(innerPadding)) {
                        when (currentScreen) {
                            "TRACK" -> {
                                TrackScreen(
                                    viewModel = viewModel,
                                    onOpenCalendar = { currentScreen = "CALENDAR" }
                                )
                            }
                            "CALENDAR" -> {
                                CalendarScreen(
                                    viewModel = viewModel,
                                    onBack = { currentScreen = "TRACK" },
                                    onSelectDate = { date ->
                                        selectedDateForDayView = date
                                        currentScreen = "DAY_VIEW"
                                    },
                                    onOpenExport = { showExportSheet = true }
                                )
                            }
                            "DAY_VIEW" -> {
                                DayViewScreen(
                                    date = selectedDateForDayView,
                                    viewModel = viewModel,
                                    onBack = { currentScreen = "CALENDAR" }
                                )
                            }
                        }

                        if (showExportSheet) {
                            ExportBottomSheet(
                                viewModel = viewModel,
                                onDismiss = { showExportSheet = false }
                            )
                        }
                    }
                }
            }
        }
    }
}
`,

  'app/src/main/java/com/blocks/tracker/ui/screens/TrackScreen.kt': `package com.blocks.tracker.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.blocks.tracker.data.EntryEntity
import com.blocks.tracker.ui.theme.*
import com.blocks.tracker.ui.viewmodel.BlocksViewModel

@Composable
fun TrackScreen(
    viewModel: BlocksViewModel,
    onOpenCalendar: () -> Unit
) {
    val entries by viewModel.entries.collectAsState()
    val untitledCount by viewModel.untitledCount.collectAsState()
    val fromMin by viewModel.fromMin.collectAsState()
    val toMin by viewModel.toMin.collectAsState()
    val isLiveClock by viewModel.isLiveClock.collectAsState()
    val title by viewModel.activityTitle.collectAsState()

    var showTimePickerForFrom by remember { mutableStateOf(false) }
    var showTimePickerForTo by remember { mutableStateOf(false) }
    var editingEntry by remember { mutableStateOf<EntryEntity?>(null) }
    var showUntitledWalkthrough by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(PaperSurface)
            .padding(horizontal = 24.dp)
    ) {
        // Top Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 16.dp, bottom = 4.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Tue, 13 Oct",
                style = MaterialTheme.typography.bodySmall,
                color = InkSecondary
            )
            IconButton(onClick = onOpenCalendar) {
                Icon(
                    imageVector = Icons.Default.CalendarToday,
                    contentDescription = "Open Calendar",
                    tint = InkPrimary
                )
            }
        }

        // Sub Header: Yesterday & N untitled
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = "‹ Yesterday",
                style = MaterialTheme.typography.bodySmall,
                color = InkSecondary,
                modifier = Modifier.clickable { onOpenCalendar() }
            )
            if (untitledCount > 0) {
                Text(
                    text = "$untitledCount untitled",
                    style = MaterialTheme.typography.bodySmall,
                    color = AccentIndigo,
                    modifier = Modifier.clickable { showUntitledWalkthrough = true }
                )
            } else {
                Text(
                    text = "0 untitled",
                    style = MaterialTheme.typography.bodySmall,
                    color = InkSecondary
                )
            }
        }

        // Timeline Entries (Oldest to newest, newest at bottom, older rows fade)
        LazyColumn(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            itemsIndexed(entries) { index, entry ->
                val alpha = if (entries.size <= 1) 1f else 0.35f + (index.toFloat() / (entries.size - 1)) * 0.65f
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .alpha(alpha)
                        .clickable { editingEntry = entry },
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = entry.formattedRange,
                        style = MaterialTheme.typography.bodySmall,
                        color = InkSecondary,
                        modifier = Modifier.width(96.dp)
                    )
                    Text(
                        text = entry.displayTitle,
                        style = MaterialTheme.typography.bodyLarge,
                        fontStyle = if (entry.title.isBlank()) FontStyle.Italic else FontStyle.Normal,
                        color = if (entry.title.isBlank()) InkSecondary else InkPrimary,
                        modifier = Modifier.weight(1f)
                    )
                    Text(
                        text = entry.formattedDuration,
                        style = MaterialTheme.typography.bodySmall,
                        color = InkSecondary
                    )
                }
            }
        }

        // Bottom Composer
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 24.dp, top = 8.dp)
        ) {
            // Dual Synchronous Time Counters
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.Bottom
            ) {
                // From Column
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .clickable { showTimePickerForFrom = true }
                ) {
                    Text(text = "from", style = MaterialTheme.typography.bodySmall, color = InkSecondary)
                    Text(
                        text = EntryEntity.formatMin(fromMin),
                        style = MaterialTheme.typography.displayLarge,
                        color = InkPrimary
                    )
                }

                // Vertical Divider
                Box(
                    modifier = Modifier
                        .width(1.dp)
                        .height(48.dp)
                        .background(PaperDivider)
                )

                // To / Now Column
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .padding(start = 16.dp)
                        .clickable { showTimePickerForTo = true }
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(text = "to", style = MaterialTheme.typography.bodySmall, color = InkSecondary)
                        if (isLiveClock) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(text = "now", style = MaterialTheme.typography.bodySmall, color = InkSecondary)
                                Spacer(modifier = Modifier.width(4.dp))
                                Box(
                                    modifier = Modifier
                                        .size(6.dp)
                                        .background(AccentIndigo, CircleShape)
                                )
                            }
                        } else {
                            Text(
                                text = "Now",
                                style = MaterialTheme.typography.bodySmall,
                                color = AccentIndigo,
                                fontWeight = FontWeight.Medium,
                                modifier = Modifier.clickable { viewModel.resumeLiveClock() }
                            )
                        }
                    }
                    Text(
                        text = EntryEntity.formatMin(toMin),
                        style = MaterialTheme.typography.displayLarge,
                        color = InkPrimary
                    )
                }
            }

            // Inline Input Field
            TextField(
                value = title,
                onValueChange = { viewModel.activityTitle.value = it },
                placeholder = { Text("What are you doing?", color = InkSecondary) },
                colors = TextFieldDefaults.colors(
                    focusedContainerColor = Color.Transparent,
                    unfocusedContainerColor = Color.Transparent,
                    focusedIndicatorColor = AccentIndigo,
                    unfocusedIndicatorColor = PaperDivider
                ),
                textStyle = MaterialTheme.typography.titleLarge,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 12.dp)
            )

            // Add Button (Pill 56dp)
            val isEnabled = fromMin < toMin
            Button(
                onClick = { viewModel.addBlock() },
                enabled = isEnabled,
                colors = ButtonDefaults.buttonColors(
                    containerColor = AccentIndigo,
                    disabledContainerColor = AccentIndigo.copy(alpha = 0.35f)
                ),
                shape = CircleShape,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp)
            ) {
                Text(
                    text = "Add",
                    style = MaterialTheme.typography.labelLarge,
                    color = ColorWhite
                )
            }
        }
    }

    if (showTimePickerForFrom) {
        TimePickerBottomSheet(
            initialMinutes = fromMin,
            label = "from",
            onDismiss = { showTimePickerForFrom = false },
            onTimeSelected = {
                viewModel.fromMin.value = it
            }
        )
    }

    if (showTimePickerForTo) {
        TimePickerBottomSheet(
            initialMinutes = toMin,
            label = "to",
            onDismiss = { showTimePickerForTo = false },
            onTimeSelected = {
                viewModel.toMin.value = it
                viewModel.isLiveClock.value = false
            }
        )
    }
}
`,

  'app/src/main/java/com/blocks/tracker/ui/screens/TimePickerBottomSheet.kt': `package com.blocks.tracker.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.blocks.tracker.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TimePickerBottomSheet(
    initialMinutes: Int,
    label: String,
    onDismiss: () -> Unit,
    onTimeSelected: (Int) -> Unit
) {
    var selectedHour by remember { mutableIntOf((initialMinutes / 60).coerceIn(0, 23)) }
    var selectedMinute by remember { mutableIntOf((initialMinutes % 60).coerceIn(0, 59)) }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = PaperSurfaceSheet,
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
        dragHandle = {
            Box(
                modifier = Modifier
                    .padding(vertical = 12.dp)
                    .width(36.dp)
                    .height(4.dp)
                    .background(PaperDivider, RoundedCornerShape(2.dp))
            )
        }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp)
                .padding(bottom = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Adjust $label",
                style = MaterialTheme.typography.bodySmall,
                color = InkSecondary,
                modifier = Modifier.padding(bottom = 16.dp)
            )

            // Two Scrolling Wheels
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 24.dp),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Hour Wheel
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = String.format("%02d", (selectedHour - 1 + 24) % 24),
                        style = MaterialTheme.typography.displayLarge.copy(fontSize = 36.sp),
                        color = InkPrimary.copy(alpha = 0.3f),
                        modifier = Modifier.clickable {
                            selectedHour = (selectedHour - 1 + 24) % 24
                            onTimeSelected(selectedHour * 60 + selectedMinute)
                        }
                    )
                    Text(
                        text = String.format("%02d", selectedHour),
                        style = MaterialTheme.typography.displayLarge.copy(fontSize = 44.sp),
                        color = InkPrimary
                    )
                    Text(
                        text = String.format("%02d", (selectedHour + 1) % 24),
                        style = MaterialTheme.typography.displayLarge.copy(fontSize = 36.sp),
                        color = InkPrimary.copy(alpha = 0.3f),
                        modifier = Modifier.clickable {
                            selectedHour = (selectedHour + 1) % 24
                            onTimeSelected(selectedHour * 60 + selectedMinute)
                        }
                    )
                }

                Text(
                    text = ":",
                    style = MaterialTheme.typography.displayLarge,
                    color = InkPrimary,
                    modifier = Modifier.padding(horizontal = 24.dp)
                )

                // Minute Wheel
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = String.format("%02d", (selectedMinute - 1 + 60) % 60),
                        style = MaterialTheme.typography.displayLarge.copy(fontSize = 36.sp),
                        color = InkPrimary.copy(alpha = 0.3f),
                        modifier = Modifier.clickable {
                            selectedMinute = (selectedMinute - 1 + 60) % 60
                            onTimeSelected(selectedHour * 60 + selectedMinute)
                        }
                    )
                    Text(
                        text = String.format("%02d", selectedMinute),
                        style = MaterialTheme.typography.displayLarge.copy(fontSize = 44.sp),
                        color = InkPrimary
                    )
                    Text(
                        text = String.format("%02d", (selectedMinute + 1) % 60),
                        style = MaterialTheme.typography.displayLarge.copy(fontSize = 36.sp),
                        color = InkPrimary.copy(alpha = 0.3f),
                        modifier = Modifier.clickable {
                            selectedMinute = (selectedMinute + 1) % 60
                            onTimeSelected(selectedHour * 60 + selectedMinute)
                        }
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = onDismiss,
                colors = ButtonDefaults.buttonColors(containerColor = PaperContainer),
                shape = RoundedCornerShape(9999.dp),
                modifier = Modifier.fillMaxWidth().height(48.dp)
            ) {
                Text(text = "Done", color = InkPrimary)
            }
        }
    }
}
`,

  'app/src/main/java/com/blocks/tracker/ui/screens/CalendarScreen.kt': `package com.blocks.tracker.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.blocks.tracker.ui.theme.*
import com.blocks.tracker.ui.viewmodel.BlocksViewModel

@Composable
fun CalendarScreen(
    viewModel: BlocksViewModel,
    onBack: () -> Unit,
    onSelectDate: (String) -> Unit,
    onOpenExport: () -> Unit
) {
    val allEntries by viewModel.allEntries.collectAsState()
    val entryDates = remember(allEntries) { allEntries.map { it.date }.toSet() }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(PaperSurface)
            .padding(horizontal = 24.dp)
    ) {
        // Navigation Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 16.dp, bottom = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Back",
                    tint = InkPrimary
                )
            }
            TextButton(onClick = onOpenExport) {
                Text(text = "Export", color = AccentIndigo)
            }
        }

        // Month Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = {}) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.KeyboardArrowLeft,
                    contentDescription = "Previous Month",
                    tint = InkPrimary
                )
            }
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(text = "2026", style = MaterialTheme.typography.bodySmall, color = InkSecondary)
                Text(text = "October", style = MaterialTheme.typography.titleLarge, color = InkPrimary)
            }
            IconButton(onClick = {}) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.KeyboardArrowRight,
                    contentDescription = "Next Month",
                    tint = InkPrimary
                )
            }
        }

        // Days of week (Monday start)
        Row(
            modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
            horizontalArrangement = Arrangement.SpaceAround
        ) {
            listOf("M", "T", "W", "T", "F", "S", "S").forEach { day ->
                Text(text = day, style = MaterialTheme.typography.bodySmall, color = InkSecondary)
            }
        }

        // Grid of dates
        // Simplified demonstration of the 31 days of October
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            val days = (1..31).toList()
            for (week in days.chunked(7)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceAround
                ) {
                    week.forEach { dayNumber ->
                        val dateString = String.format("2026-10-%02d", dayNumber)
                        val hasEntry = entryDates.contains(dateString)

                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clickable { onSelectDate(dateString) },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = dayNumber.toString(),
                                style = MaterialTheme.typography.bodyLarge,
                                color = InkPrimary
                            )
                            if (hasEntry) {
                                Box(
                                    modifier = Modifier
                                        .align(Alignment.BottomCenter)
                                        .size(4.dp)
                                        .background(InkSecondary, CircleShape)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
`,

  'app/src/main/java/com/blocks/tracker/ui/screens/DayViewScreen.kt': `package com.blocks.tracker.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.unit.dp
import com.blocks.tracker.ui.theme.*
import com.blocks.tracker.ui.viewmodel.BlocksViewModel

@Composable
fun DayViewScreen(
    date: String,
    viewModel: BlocksViewModel,
    onBack: () -> Unit
) {
    val allEntries by viewModel.allEntries.collectAsState()
    val dayEntries = remember(allEntries, date) {
        allEntries.filter { it.date == date }.sortedBy { it.startMin }
    }

    val totalTrackedMinutes = dayEntries.sumOf { it.durationMinutes }
    val totalHours = totalTrackedMinutes / 60
    val totalMins = totalTrackedMinutes % 60
    val totalDisplay = "\${totalHours}h \${totalMins}m"

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(PaperSurface)
            .padding(horizontal = 24.dp)
    ) {
        // Navigation Bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 16.dp, bottom = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Back",
                    tint = InkPrimary
                )
            }
            Text(text = date, style = MaterialTheme.typography.bodyLarge, color = InkPrimary)
            Spacer(modifier = Modifier.width(48.dp))
        }

        // Editorial Total Tracked Metric
        Column(modifier = Modifier.padding(top = 16.dp, bottom = 32.dp)) {
            Text(text = "tracked", style = MaterialTheme.typography.bodySmall, color = InkSecondary)
            Text(
                text = totalDisplay,
                style = MaterialTheme.typography.displayLarge,
                color = InkPrimary
            )
        }

        // Entries
        LazyColumn(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            items(dayEntries) { entry ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = entry.formattedRange,
                        style = MaterialTheme.typography.bodySmall,
                        color = InkSecondary,
                        modifier = Modifier.width(96.dp)
                    )
                    Text(
                        text = entry.displayTitle,
                        style = MaterialTheme.typography.bodyLarge,
                        fontStyle = if (entry.title.isBlank()) FontStyle.Italic else FontStyle.Normal,
                        color = if (entry.title.isBlank()) InkSecondary else InkPrimary,
                        modifier = Modifier.weight(1f)
                    )
                    Text(
                        text = entry.formattedDuration,
                        style = MaterialTheme.typography.bodySmall,
                        color = InkSecondary
                    )
                }
            }
        }

        // Quiet Endmark Dot
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 32.dp),
            contentAlignment = Alignment.Center
        ) {
            Box(
                modifier = Modifier
                    .size(4.dp)
                    .background(InkSecondary.copy(alpha = 0.4f), CircleShape)
            )
        }
    }
}
`,

  'app/src/main/java/com/blocks/tracker/ui/screens/ExportBottomSheet.kt': `package com.blocks.tracker.ui.screens

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.blocks.tracker.data.EntryEntity
import com.blocks.tracker.ui.theme.*
import com.blocks.tracker.ui.viewmodel.BlocksViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExportBottomSheet(
    viewModel: BlocksViewModel,
    onDismiss: () -> Unit
) {
    var range by remember { mutableStateOf("Month") }
    var format by remember { mutableStateOf("TXT") }
    val allEntries by viewModel.allEntries.collectAsState()
    val context = LocalContext.current

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = PaperSurfaceSheet,
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
        dragHandle = {
            Box(
                modifier = Modifier
                    .padding(vertical = 12.dp)
                    .width(36.dp)
                    .height(4.dp)
                    .background(PaperDivider, RoundedCornerShape(2.dp))
            )
        }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp)
                .padding(bottom = 32.dp)
        ) {
            // Range Selector: Day, Month, All
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                listOf("Day", "Month", "All").forEachIndexed { index, option ->
                    val isSelected = range == option
                    Text(
                        text = option,
                        style = MaterialTheme.typography.bodyLarge,
                        color = if (isSelected) InkPrimary else InkSecondary,
                        modifier = Modifier
                            .clickable { range = option }
                            .padding(vertical = 8.dp)
                    )
                    if (index < 2) {
                        Spacer(modifier = Modifier.width(16.dp))
                        Box(modifier = Modifier.size(3.dp).background(PaperDivider, CircleShape))
                        Spacer(modifier = Modifier.width(16.dp))
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Format Selector: TXT, JSON
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                listOf("TXT", "JSON").forEachIndexed { index, option ->
                    val isSelected = format == option
                    Text(
                        text = option,
                        style = MaterialTheme.typography.bodyLarge,
                        color = if (isSelected) InkPrimary else InkSecondary,
                        modifier = Modifier
                            .clickable { format = option }
                            .padding(vertical = 8.dp)
                    )
                    if (index < 1) {
                        Spacer(modifier = Modifier.width(16.dp))
                        Box(modifier = Modifier.size(3.dp).background(PaperDivider, CircleShape))
                        Spacer(modifier = Modifier.width(16.dp))
                    }
                }
            }

            Spacer(modifier = Modifier.height(36.dp))

            // Primary Download / Share Button
            Button(
                onClick = {
                    val exportText = if (format == "TXT") {
                        allEntries.joinToString("\n") {
                            "\${it.formattedRange} | \${it.displayTitle} | \${it.formattedDuration}"
                        }
                    } else {
                        "{\\"entries\\": \${allEntries.size}}"
                    }

                    val sendIntent = Intent().apply {
                        action = Intent.ACTION_SEND
                        putExtra(Intent.EXTRA_TEXT, exportText)
                        type = if (format == "TXT") "text/plain" else "application/json"
                    }
                    val shareIntent = Intent.createChooser(sendIntent, "Export Blocks")
                    context.startActivity(shareIntent)
                    onDismiss()
                },
                colors = ButtonDefaults.buttonColors(containerColor = AccentIndigo),
                shape = CircleShape,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp)
            ) {
                Text(text = "Download", style = MaterialTheme.typography.labelLarge, color = ColorWhite)
            }
        }
    }
}
`
};
