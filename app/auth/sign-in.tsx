// Update sign-in.tsx to remove LinearGradient from button
// Replace LinearGradient with regular View with backgroundColor
// ... (rest of the imports remain the same)

const styles = StyleSheet.create({
  // ... (previous styles remain the same)
  signInButton: {
    backgroundColor: '#FF6A00',
    borderRadius: 16,
    marginTop: 12,
    marginBottom: 24,
    shadowColor: '#FF6A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  // ... (rest of the styles remain the same)
});