package com.blocks.tracker.ui.screens

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
