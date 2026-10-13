package com.blocks.tracker.ui.screens

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
                        allEntries.joinToString("
") {
                            "${it.formattedRange} | ${it.displayTitle} | ${it.formattedDuration}"
                        }
                    } else {
                        "{\"entries\": ${allEntries.size}}"
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
