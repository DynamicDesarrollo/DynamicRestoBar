/**
 * Envía comandos de configuración de red a la impresora
 * via Windows Print Spooler (USB) usando raw printing.
 * 
 * Ejecutar: node set-printer-ip.js
 */
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ── Configuración ─────────────────────────────────────────────────────────────
const PRINTER_NAME = 'POS Printer 203DPI  Series'; // nombre exacto de Windows
const NEW_IP       = '192.168.1.101';
const NEW_MASK     = '255.255.255.0';
const NEW_GW       = '192.168.1.1';
// ─────────────────────────────────────────────────────────────────────────────

// Comandos de red en formato texto plano (protocolo de configuración genérico)
const netConfig = [
  `SET ETH IP ${NEW_IP}`,
  `SET ETH MASK ${NEW_MASK}`,
  `SET ETH GW ${NEW_GW}`,
  `SET ETH DHCP OFF`,
  `RESET`,
].join('\r\n') + '\r\n';

// Comando ESC/POS para reset de red (algunos modelos)
const ESC_RESET = Buffer.from([0x1B, 0x40]); // ESC @  initialize

const tmpFile = path.join(os.tmpdir(), 'printer_net_config.txt');
fs.writeFileSync(tmpFile, netConfig, 'ascii');

console.log('📡 Configuración a enviar:');
console.log(netConfig);
console.log(`📁 Archivo temporal: ${tmpFile}`);
console.log(`🖨️  Impresora destino: "${PRINTER_NAME}"`);
console.log('');

// PowerShell script para enviar raw data a la impresora por nombre
const psScript = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class RawPrint {
    [DllImport("winspool.drv", CharSet=CharSet.Auto, SetLastError=true)]
    public static extern bool OpenPrinter(string pPrinterName, out IntPtr phPrinter, IntPtr pDefault);
    [DllImport("winspool.drv", CharSet=CharSet.Auto, SetLastError=true)]
    public static extern bool ClosePrinter(IntPtr hPrinter);
    [DllImport("winspool.drv", CharSet=CharSet.Auto, SetLastError=true)]
    public static extern int StartDocPrinter(IntPtr hPrinter, int Level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);
    [DllImport("winspool.drv", SetLastError=true)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);
    [DllImport("winspool.drv", SetLastError=true)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);
    [DllImport("winspool.drv", SetLastError=true)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);
    [DllImport("winspool.drv", SetLastError=true)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);
}
[StructLayout(LayoutKind.Sequential, CharSet=CharSet.Auto)]
public class DOCINFOA {
    [MarshalAs(UnmanagedType.LPTStr)] public string pDocName;
    [MarshalAs(UnmanagedType.LPTStr)] public string pOutputFile;
    [MarshalAs(UnmanagedType.LPTStr)] public string pDataType;
}
"@

\$printerName = "${PRINTER_NAME}"
\$data = [System.IO.File]::ReadAllBytes("${tmpFile.replace(/\\/g, '\\\\')}")

\$hPrinter = [IntPtr]::Zero
if ([RawPrint]::OpenPrinter(\$printerName, [ref]\$hPrinter, [IntPtr]::Zero)) {
    \$di = New-Object DOCINFOA
    \$di.pDocName = "NetConfig"
    \$di.pDataType = "RAW"
    
    if ([RawPrint]::StartDocPrinter(\$hPrinter, 1, \$di)) {
        [RawPrint]::StartPagePrinter(\$hPrinter) | Out-Null
        \$ptr = [System.Runtime.InteropServices.Marshal]::AllocHGlobal(\$data.Length)
        [System.Runtime.InteropServices.Marshal]::Copy(\$data, 0, \$ptr, \$data.Length)
        \$written = 0
        \$result = [RawPrint]::WritePrinter(\$hPrinter, \$ptr, \$data.Length, [ref]\$written)
        [System.Runtime.InteropServices.Marshal]::FreeHGlobal(\$ptr)
        [RawPrint]::EndPagePrinter(\$hPrinter) | Out-Null
        [RawPrint]::EndDocPrinter(\$hPrinter) | Out-Null
        Write-Host "OK: \$written bytes enviados"
    } else {
        Write-Host "ERROR: No se pudo iniciar documento. Error: \$([System.Runtime.InteropServices.Marshal]::GetLastWin32Error())"
    }
    [RawPrint]::ClosePrinter(\$hPrinter) | Out-Null
} else {
    Write-Host "ERROR: No se pudo abrir la impresora '\$printerName'. Error: \$([System.Runtime.InteropServices.Marshal]::GetLastWin32Error())"
    Write-Host "Impresoras disponibles:"
    Get-Printer | Select-Object Name
}
`;

const psTmp = path.join(os.tmpdir(), 'rawprint.ps1');
fs.writeFileSync(psTmp, psScript, 'utf8');

exec(`powershell -ExecutionPolicy Bypass -File "${psTmp}"`, (err, stdout, stderr) => {
  console.log('Resultado:', stdout);
  if (stderr) console.error('Stderr:', stderr);
  if (err) console.error('Error:', err.message);
  
  // Limpiar temporales
  try { fs.unlinkSync(tmpFile); fs.unlinkSync(psTmp); } catch {}
  
  if (stdout.includes('OK:')) {
    console.log(`\n✅ Comandos enviados. Espera ~10 segundos y luego conecta`);
    console.log(`   el cable ethernet al router.`);
    console.log(`   Nuevo acceso: http://${NEW_IP}`);
  } else {
    console.log('\n⚠️  Puede que el nombre de la impresora sea diferente.');
    console.log('   Revisa el nombre exacto arriba en "Impresoras disponibles"');
  }
});
