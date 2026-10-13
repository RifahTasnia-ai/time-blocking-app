package com.blocks.tracker.ui.screens

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
