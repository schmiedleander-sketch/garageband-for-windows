#define _WIN32_WINNT 0x0600
#include <windows.h>
#include <shellapi.h>
#include <shlwapi.h>
#include <stdio.h>
#include <stdlib.h>

#define IDI_APPICON 101

// Global application window class
static const char g_szClassName[] = "GarageBandWindowClass";

// Find current module directory
void GetAppDir(char* outPath, DWORD maxLen) {
    GetModuleFileNameA(NULL, outPath, maxLen);
    char* lastSlash = strrchr(outPath, '\\');
    if (lastSlash) {
        *lastSlash = '\0';
    }
}

// Window Procedure
LRESULT CALLBACK WndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    switch (msg) {
        case WM_CREATE: {
            // Setup title & icon
            break;
        }
        case WM_COMMAND: {
            break;
        }
        case WM_DESTROY: {
            PostQuitMessage(0);
            return 0;
        }
        default:
            return DefWindowProc(hwnd, msg, wParam, lParam);
    }
    return 0;
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    char appDir[MAX_PATH];
    char indexPath[MAX_PATH];
    char edgeCmd[MAX_PATH * 2];
    GetAppDir(appDir, MAX_PATH);

    snprintf(indexPath, sizeof(indexPath), "%s\\app\\index.html", appDir);

    // If app/index.html doesn't exist, check current directory
    DWORD dwAttrib = GetFileAttributesA(indexPath);
    if (dwAttrib == INVALID_FILE_ATTRIBUTES) {
        snprintf(indexPath, sizeof(indexPath), "%s\\index.html", appDir);
    }

    // Try to launch in App Mode using Microsoft Edge or default browser (looks and feels like native modern Windows app)
    snprintf(edgeCmd, sizeof(edgeCmd), "--app=\"file:///%s\" --window-size=1280,800", indexPath);

    // Check if msedge.exe is available
    HINSTANCE hRes = ShellExecuteA(NULL, "open", "msedge.exe", edgeCmd, NULL, SW_SHOWNORMAL);
    if ((INT_PTR)hRes <= 32) {
        // Fallback to default shell association (Chrome or Default browser)
        ShellExecuteA(NULL, "open", indexPath, NULL, NULL, SW_SHOWNORMAL);
    }

    return 0;
}
