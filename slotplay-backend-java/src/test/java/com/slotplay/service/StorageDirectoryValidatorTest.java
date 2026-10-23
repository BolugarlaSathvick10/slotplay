package com.slotplay.service;

import com.slotplay.service.impl.LocalStorageService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.File;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class StorageDirectoryValidatorTest {

    @Test
    @DisplayName("Storage directory validator succeeds for writable temporary directory")
    void testStorageDirectoryValidationSucceeds(@TempDir Path tempDir) {
        LocalStorageService storageService = new LocalStorageService();
        storageService.setUploadDir(tempDir.toString());

        assertDoesNotThrow(storageService::validateStorageDirectory);
    }

    @Test
    @DisplayName("Storage directory validator fails fast when target path cannot be created or is not writable")
    void testStorageDirectoryValidationFailsOnInvalidPath(@TempDir Path tempDir) {
        // Create a regular file and try to use it as a directory path
        File conflictFile = tempDir.resolve("conflict_file.txt").toFile();
        try {
            assertTrue(conflictFile.createNewFile());
            LocalStorageService storageService = new LocalStorageService();
            // Path inside a file is impossible to create as directory
            storageService.setUploadDir(conflictFile.getAbsolutePath() + "/subfolder");

            assertThrows(IllegalStateException.class, storageService::validateStorageDirectory);
        } catch (Exception e) {
            fail("Failed setting up test file: " + e.getMessage());
        }
    }
}
