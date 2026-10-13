package com.blocks.tracker

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
