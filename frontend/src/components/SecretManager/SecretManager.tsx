import { useState, useEffect } from "react";
import { Button, Input, Card, CardBody, CardHeader, CardFooter, Divider } from "@nextui-org/react";

interface SecretPair {
  key: string;
  value: string;
  id: string;
}

export const SecretManager = () => {
  const [secretPairs, setSecretPairs] = useState<SecretPair[]>([
    { key: "", value: "", id: crypto.randomUUID() }
  ]);
  const [isSaved, setIsSaved] = useState(false);

  // Load secrets from localStorage on component mount
  useEffect(() => {
    try {
      const savedSecrets = localStorage.getItem("APP_SECRET");
      if (savedSecrets) {
        const parsedSecrets = JSON.parse(atob(savedSecrets));
        if (Array.isArray(parsedSecrets) && parsedSecrets.length > 0) {
          setSecretPairs(parsedSecrets);
        }
      }
    } catch (error) {
      console.error("Error loading secrets from localStorage:", error);
    }
  }, []);

  const handleAddPair = () => {
    setSecretPairs([...secretPairs, { key: "", value: "", id: crypto.randomUUID() }]);
    setIsSaved(false);
  };

  const handleRemovePair = (id: string) => {
    if (secretPairs.length > 1) {
      setSecretPairs(secretPairs.filter(pair => pair.id !== id));
      setIsSaved(false);
    }
  };

  const handleKeyChange = (id: string, newKey: string) => {
    setSecretPairs(
      secretPairs.map(pair => 
        pair.id === id ? { ...pair, key: newKey } : pair
      )
    );
    setIsSaved(false);
  };

  const handleValueChange = (id: string, newValue: string) => {
    setSecretPairs(
      secretPairs.map(pair => 
        pair.id === id ? { ...pair, value: newValue } : pair
      )
    );
    setIsSaved(false);
  };

  const handleSave = () => {
    try {
      // Filter out empty pairs
      const filteredPairs = secretPairs.filter(pair => pair.key.trim() !== "");

      // Convert to Record<string, string>
      const secretRecord = filteredPairs.reduce((acc: Record<string, string>, pair) => {
        acc[pair.key] = pair.value;
        return acc;
      }, {});

      localStorage.setItem("APP_SECRET", btoa(JSON.stringify(secretRecord)));
      setIsSaved(true);
      
      // Show saved status for 3 seconds
      setTimeout(() => {
        setIsSaved(false);
      }, 3000);
    } catch (error) {
      console.error("Error saving secrets to localStorage:", error);
    }
  };

  return (
    <Card className="max-w-[800px] mx-auto my-8">
      <CardHeader className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Secret Manager</h2>
        <div className="flex gap-2">
          <Button 
            color="primary" 
            variant="flat" 
            onPress={handleAddPair}
            startContent={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            }
          >
            Add Pair
          </Button>
          <Button 
            color="success" 
            onPress={handleSave}
            startContent={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            }
          >
            Save
          </Button>
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="gap-4">
        <p className="text-sm text-foreground/70 mb-2">
          Add key-value pairs that will be stored in your browser's local storage.
        </p>
        
        {secretPairs.map((pair, index) => (
          <div key={pair.id} className="flex gap-4 items-center">
            <Input
              label="Key"
              placeholder="Enter key"
              value={pair.key}
              onChange={(e) => handleKeyChange(pair.id, e.target.value)}
              className="flex-1"
            />
            <Input
              label="Value"
              placeholder="Enter value"
              value={pair.value}
              onChange={(e) => handleValueChange(pair.id, e.target.value)}
              className="flex-1"
            />
            <Button
              isIconOnly
              color="danger"
              variant="light"
              onPress={() => handleRemovePair(pair.id)}
              disabled={secretPairs.length <= 1}
              className="mt-5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </Button>
          </div>
        ))}
      </CardBody>
      <CardFooter>
        {isSaved && (
          <div className="text-success flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Secrets saved successfully!</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default SecretManager;
